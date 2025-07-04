import Door from "../components/custom/door";
import Plant from "../components/custom/plant";
import Planter from "../components/custom/planter";
import Polluter from "../components/custom/polluter";
import TalkComponent from "../components/generic/talk";
import { game } from "../game";
import { MilestonePopupManager } from "../ui/milestonePopup";
import { QuestMarker } from "../ui/questMarker";
import { UI } from "../ui/ui";
import { UIElement } from "../ui/uiElement";
import { Milestone } from "./milestone";


export class MilestoneManager {
    popups: MilestonePopupManager;
    milestones: Map<string, Milestone> = new Map<string, Milestone>();
    questList!: UIElement;
    questContainer!: UIElement;
    questListTitle!: UIElement;
    private _currentTier = 0;
    public get currentTier() {
        return this._currentTier;
    }
    public set currentTier(value) {
        this._currentTier = value;
        for (const milestone of this.milestones.values()) {
            if (milestone.tier == this._currentTier && milestone.issueImmediately) milestone.issue();
        }
        this.displayQuests();
    }
    constructor() {
        this.popups = new MilestonePopupManager();
    }
    displayQuests() {
        this.questList.htmlElement.innerHTML = "";
        this.questListTitle.htmlElement.innerHTML = `Tier ${this.currentTier} Milestones`;
        let availableQuestsInTier = 0;
        let availableQuestsInNextTier = 0;
        for (const milestone of this.milestones.values()) {
            if (!milestone.completed && milestone.parent == undefined && milestone.tier == this.currentTier && milestone.enabled) {
                availableQuestsInTier++;
                console.log("available:" + milestone.name);
                break;
            }
            if (!milestone.completed && milestone.parent == undefined && milestone.tier == this.currentTier + 1) {
                availableQuestsInNextTier++;
            }
        }
        if (availableQuestsInTier == 0 && availableQuestsInNextTier > 0) {
            this.currentTier++;
            return;
        }
        for (const milestone of this.milestones.values()) {
            if (!milestone.completed && milestone.parent == undefined && milestone.tier == this.currentTier && milestone.enabled) {
                const quest = new UIElement({ type: "div", classes: ["quest"], parent: this.questList.htmlElement, content: `<p>${milestone.name}</p>` });
                if (milestone.details) new UIElement({ type: "p", classes: ["details"], parent: quest.htmlElement, content: milestone.details });
                for (let i = 0; i < milestone.children.length; i++) {
                    const sub = milestone.children[i];
                    if (sub.enabled == false) continue;
                    if (sub.completed) continue;
                    const subQuest = new UIElement({ type: "div", classes: ["sub-quest"], parent: quest.htmlElement, content: `<p>${sub.name}</p>` });
                    if (sub.details) new UIElement({ type: "p", classes: ["details"], parent: subQuest.htmlElement, content: sub.details });
                    if (!sub.completed && milestone.sequential) break;
                }
            }
        }
    }
    getQuest(id: string) { return this.milestones.get(id); }
    completeQuest(id: string, detailsText?: string, data?: any) { this.milestones.get(id)?.complete(detailsText, data); }
    issueQuest(id: string, silent?: boolean) { this.milestones.get(id)?.issue(silent); }

    initQuests() {
        this.questContainer = new UIElement({ type: "div", classes: ["quest-list"], parent: UI.container });
        this.questListTitle = new UIElement({ type: "h1", parent: this.questContainer.htmlElement, content: `Milestones` });
        this.questList = new UIElement({ type: "div", parent: this.questContainer.htmlElement });

        const biocharQuest = new Milestone({
            name: "The next generation", id: "biocharQuest", reward: 1000, tier: 2, issueImmediately: true, subTasks: [
                { name: "Build a biochar kiln", id: "buildBiocharKiln", reward: 100, details: "Build a biochar kiln. It safely burns plant matter to store the plants' CO2 and improve fertility." },
                { name: "Plant a second generation of plants", id: "biocharPlants", reward: 100, details: "You can slowly introduce more complex plants like trees once the soil is stable enough." },
            ]
        });

        const plantQuest = new Milestone({
            name: "The first plant", id: "firstPlant", reward: 1000, tier: 1, issueImmediately: true, subTasks: [
                {
                    name: "Find the seed vault", id: "findSeedVault", reward: 100, details: "There is an old signal transmitting the location of an ancient seed vault.",
                    onIssue: (milestone) => {
                        milestone.marker = QuestMarker.atEntity(game.activeScene.findComponents(Door).find(comp => comp.doorId === "seed-dungeon")!.entity, "Mysterious signal");
                    }
                },
                { name: "Find plant seeds", id: "findSeed", reward: 100, details: "There should be a seed crate in the seed vault." },
                { name: "Plant a seed", id: "plantSeed", reward: 100, details: "Press T to select a seed. Then click on the ground to plant it." },
                { name: "Fully grow a plant", id: "growPlant", reward: 100, details: "Plants need moisture and fertility to grow. Watch out for air pollution!" },
            ]
        });
        const cleanUpQuest = new Milestone({
            name: "Cleaning up", id: "cleanUp", reward: 1000, tier: 1, issueImmediately: true, sequential: false, subTasks: [
                {
                    name: "Remove the pollution sources", id: "cleanUpBarrels", reward: 100, details: "Scanners have detected a source of pollution at the indicated coordinates.",
                    onIssue: (milestone) => {
                        milestone.marker = QuestMarker.atEntity(game.activeScene.findComponents(Polluter)[0]!.entity, "Pollution source");
                    }
                },
                {
                    name: "Stop the polluting factory", id: "cleanUpFactory", reward: 100, details: "There is an automated facility producing air pollution and CO2 in the region.",
                    onIssue: (milestone) => {
                        //milestone.marker = QuestMarker.atEntity(game.activeScene.findComponents(Polluter)[0]!.entity, "Pollution source");
                    }
                },
            ]
        });
        const tutorialQuest = new Milestone({
            name: "Introduction", id: "tutorial", reward: 100, tier: 0, subTasks: [
                {
                    name: "Try your movement", id: "tutMovement", reward: 0, details: "Use WASD to move around. Reach the room on the right to continue.", celebrate: false,
                    onComplete: () => {
                        game.camera.targetZoom = 1.2;
                        game.activeScene.findEntityByName("PlanterGood")!.getComponent(Planter)!.enabled = false;
                        game.activeScene.findEntityByName("PlanterBad")!.getComponent(Planter)!.enabled = false;
                        //new QuestMarker(game.activeScene.findEntityByName("Director")!.transform.position);
                    }
                },
                {
                    name: "Talk to the UNERA director", id: "tutTalk", reward: 0, details: "Press F to interact with the director. He will give you some instructions.", celebrate: false,
                    onComplete: (data: TalkComponent) => {
                        data.talkId = "spaceDirectorTutorialLeft";
                        data.autoTalk = 2;
                        //data.talkIndex = 1;
                    }
                },
                {
                    name: "Plant a seed in the watered planter", id: "tutPlant1", reward: 0, details: "Plants will thrive with water and nutrients. <br>Press T to select a seed.", celebrate: false,
                    onIssue: (milestone: Milestone) => {
                        game.camera.targetZoom = 1;
                        game.activeScene.findEntityByName("PlanterGood")!.getComponent(Planter)!.enabled = true;
                        milestone.marker = QuestMarker.atEntity(game.activeScene.findEntityByName("PlanterGood")!, "Plant a seed here");
                    },
                    onComplete: () => {

                    }
                },
                {
                    name: "Plant a seed in the dry planter", id: "tutPlant2", reward: 0, details: "Observe plants will struggle without water and nutrients.", celebrate: false,
                    onIssue: (milestone: Milestone) => {
                        const director = game.activeScene.findEntityByName("Director")!.getComponent(TalkComponent)!;
                        director.talkId = "spaceDirectorTutorialRight";
                        director.activate();
                        director.autoTalk = 1;
                        game.activeScene.findEntityByName("PlanterBad")!.getComponent(Planter)!.enabled = true;
                        milestone.marker = QuestMarker.atEntity(game.activeScene.findEntityByName("PlanterBad")!, "Plant a seed here");
                    },
                    onComplete: () => {
                        game.camera.targetZoom = 1;
                        game.camera.zoomSpeed = 1;
                        const director = game.activeScene.findEntityByName("Director")!.getComponent(TalkComponent)!;
                        director.talkId = "spaceDirectorTutorialComplete";
                        director.activate();
                        director.autoTalk = 2;
                        const targetDoor = game.activeScene.findComponents(Door).find(comp => comp.doorId === "space-door-1");
                        targetDoor!.enabled = true;
                    }
                },
                { name: "Proceed to the planet", id: "tutPlanet", reward: 0, details: "You are ready for the mission. Proceed to the right and enter the door.", celebrate: false, },
            ],
            onComplete: () => {
                //this.currentTier = 1;
            }
        });
        game.events.on("playerBuild", entity => {
            if (entity.getComponent(Plant)) {
                this.completeQuest("plantSeed", `You planted a ${entity.getComponent(Plant)!.species.name}`);
                this.completeQuest("tutPlant1", `Observe how plants will thrive in the watered planter.`);
                this.completeQuest("tutPlant2", `Observe plants will struggle without water and nutrients.`);
            }
            /*if (entity.getComponent(BiocharKiln)) {
                this.completeQuest("buildBiocharKiln");
            }*/
        });
        game.events.on("plantGrow", plant => {
            this.completeQuest("growPlant", `${plant.species.name} has grown to maturity`);
        });
        game.events.on("triggerEnter", triggerName => {
            if (triggerName == "movementComplete") this.completeQuest("tutMovement");
            if (triggerName == "planetLanding") this.completeQuest("tutPlanet");
        });
        game.events.on("doorEnter", door => {
            if (door.doorId == "seed-dungeon") this.completeQuest("findSeedVault");
        })
        game.events.on("talkEnd", talk => {
            if (talk.talkId == "spaceDirectorGreeting") this.completeQuest("tutTalk", "", talk);
        });
        game.events.on("entityInteract", entity => {
            if (entity.name == "Polluter") this.completeQuest("cleanUpBarrels");
            if (entity.name == "Seed Chest") this.completeQuest("findSeed");
            if (entity.name == "Factory Pollution Switch") this.completeQuest("cleanUpFactory");
            if (entity.name == "Biochar Kiln") this.completeQuest("buildBiocharKiln");
        })
    }
}
