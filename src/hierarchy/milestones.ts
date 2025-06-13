import { Door } from "../components/custom/door";
import { Plant } from "../components/custom/plant";
import { game } from "../game";
import { UI, UIElement, UIPanel } from "../ui/ui";
import { sleep } from "../utils/utils";

export type SubMilestoneOptions = {
    id: string,
    name: string,
    reward: number,
    parent?: Milestone,
    details?: string,
    onComplete?: () => void
};

export type MilestoneOptions = SubMilestoneOptions & {
    tier?: number,
    subTasks?: SubMilestoneOptions[],
    sequential?: boolean
};

export class Milestone {
    reward = 0;
    private _completed = false;
    tier: number;
    name: string;
    parent?: Milestone;
    children: Milestone[] = [];
    id: string;
    sequential = true;
    enabled = true;
    details?: string;
    onComplete?: () => void;
    public get completed() {
        return this._completed;
    }
    constructor(options: MilestoneOptions) {
        this.details = options.details;
        this.id = options.id;
        this.name = options.name;
        this.tier = options.tier ?? 0;
        this.sequential = options.sequential ?? true;
        const reward = options.reward;
        this.parent = options.parent;
        this.onComplete = options.onComplete;
        if (this.parent) {
            this.tier = this.parent.tier;
        }
        if (options.subTasks) this.children = options.subTasks.map(task => {
            task.parent = this;
            const child = new Milestone(task);
            if (this.sequential) child.enabled = false;
            return child;
        });
        if (this.children.length > 0) this.children[0].enabled = true;
        game.milestones.milestones.set(this.id, this);
        this.reward = reward ?? 0;
    }
    async complete(detailsText?: string) {
        const waitMult = 1;
        if (this._completed) return;
        if (this.tier != game.milestones.currentTier || !this.enabled) return;
        this._completed = true;
        game.soundManager.soundLibrary.play("milestone",{singleInstance: true});
        const panel = UIElement.create({ type: "div", classes: ["milestone", "appear"], parent: UI.container, content: `` });
        const header = UIElement.create({ type: "p", parent: panel.htmlElement, content: "Milestone achieved" });
        const title = UIElement.create({ type: "h1", parent: panel.htmlElement, content: this.name });
        const details = UIElement.create({ type: "p", parent: panel.htmlElement, content: detailsText ?? "", classes: ["details"] });
        requestAnimationFrame(() => {
            header.htmlElement.classList.add("appear");
        });
        await sleep(500 * waitMult);
        title.htmlElement.classList.add("appear");
        details.htmlElement.classList.add("appear");
        game.score.addWithFx(this.reward, { x: .5, y: .15 });
        if (this.onComplete) this.onComplete();
        
        game.milestones.displayQuests();
        this.parent?.checkChildren();
        
        await sleep(5000 * waitMult);
        panel.htmlElement.classList.remove("appear");
        await sleep(3000);
        panel.remove();
    }
    checkChildren() {
        for (let i = 1; i < this.children.length; i++) {
            if (this.children[i - 1].completed) this.children[i].enabled = true;
        }
        for (const child of this.children) {
            if (!child.completed) return false;
        }
        this.complete();
    }
}

export class MilestoneManager {
    milestones: Map<string, Milestone> = new Map<string, Milestone>();
    questList!: UIElement;
    questContainer!: UIElement;
    questListTitle!: UIElement;
    currentTier = 0;
    constructor() {
    }
    init() {
        this.questContainer = UIElement.create({ type: "div", classes: ["quest-list"], parent: UI.container });
        this.questListTitle = UIElement.create({ type: "h1", parent: this.questContainer.htmlElement, content: `Milestones` });
        this.questList = UIElement.create({ type: "div", parent: this.questContainer.htmlElement });

        const plantQuest = new Milestone({
            name: "The first plant", id: "firstPlant", reward: 1000, tier: 1, subTasks: [
                //{ name: "Find a seed", id: "findSeed", reward: 100, details: "There are no seeds in the game yet." },
                { name: "Plant a seed", id: "plantSeed", reward: 100, details: "Press T to select a seed. Then click on the ground to plant it." },
                { name: "Fully grow a plant", id: "growPlant", reward: 100, details: "Plants need moisture and fertility to grow. Watch out for air pollution!" },
            ]
        });
        const tutorialQuest = new Milestone({
            name: "Tutorial", id: "tutorial", reward: 1000, tier: 0, subTasks: [
                {
                    name: "Try your movement", id: "tutMovement", reward: 0, details: "Use WASD to move around. Reach the room on the right to continue.",
                    onComplete: () => {
                        game.camera.targetZoom = 1;
                        game.camera.zoomSpeed = 1;
                    }
                },
                {
                    name: "Plant a seed", id: "tutPlant", reward: 0, details: "Press T to select a seed. Then click on the ground to plant it.",
                    onComplete: () => {
                        const targetDoor = game.activeScene.findComponents(Door).find(comp => comp.doorId === "space-door-1");
                        targetDoor!.enabled = true;
                    }
                },
                { name: "Proceed to the planet", id: "tutPlanet", reward: 1000, details: "You are ready for the mission. Proceed to the right and enter the door." },
            ],
            onComplete: () => {
                this.currentTier = 1;
            }
        });
        game.events.on("playerBuild", entity => {
            if (entity.getComponent(Plant)) {
                this.completeQuest("plantSeed", `You planted a ${entity.getComponent(Plant)!.species.name}`);
                this.completeQuest("tutPlant", `You planted a ${entity.getComponent(Plant)!.species.name}`);
            }
        })
        game.events.on("plantGrow", plant => {
            this.completeQuest("growPlant", `${plant.species.name} has grown to maturity`);
        })
        game.events.on("triggerEnter", triggerName => {
            if (triggerName == "movementComplete") this.completeQuest("tutMovement");
            if (triggerName == "planetLanding") this.completeQuest("tutPlanet");
        })
        this.displayQuests();
    }
    displayQuests() {
        this.questList.htmlElement.innerHTML = "";
        this.questListTitle.htmlElement.innerHTML = `Tier ${this.currentTier} Milestones`;
        for (const milestone of this.milestones.values()) {
            if (!milestone.completed && milestone.parent == undefined && milestone.tier == this.currentTier) {
                const quest = UIElement.create({ type: "div", classes: ["quest"], parent: this.questList.htmlElement, content: `<p>${milestone.name}</p>` });
                if (milestone.details) UIElement.create({ type: "p", classes: ["details"], parent: quest.htmlElement, content: milestone.details });
                for (let i = 0; i < milestone.children.length; i++) {
                    const sub = milestone.children[i];
                    if (sub.completed) continue;
                    const subQuest = UIElement.create({ type: "div", classes: ["sub-quest"], parent: quest.htmlElement, content: `<p>${sub.name}</p>` });
                    if (sub.details) UIElement.create({ type: "p", classes: ["details"], parent: subQuest.htmlElement, content: sub.details });
                    if (!sub.completed && milestone.sequential) break;
                }
            }
        }
    }
    getQuest(id: string) { return this.milestones.get(id); }
    completeQuest(id: string, detailsText?: string) { this.milestones.get(id)?.complete(detailsText); }
}