import { Plant } from "../components/custom/plant";
import { game } from "../game";
import { UI, UIElement, UIPanel } from "../ui/ui";
import { sleep } from "../utils/utils";

export class Milestone {
    reward = 0;
    private _completed = false;
    public get completed() {
        return this._completed;
    }
    constructor(public name: string, reward?: number) {
        game.milestones.milestones.push(this);
        this.reward = reward ?? 0;
    }
    async complete(detailsText?: string) {
        if (this._completed) return;
        this._completed = true;
        game.soundManager.soundLibrary.play("milestone");
        const panel = UIElement.create({ type: "div", classes: ["milestone", "appear"], parent: UI.container, content: `` });
        const header = UIElement.create({ type: "p", parent: panel.htmlElement, content: "Milestone achieved" });
        const title = UIElement.create({ type: "h1", parent: panel.htmlElement, content: this.name });
        const details = UIElement.create({ type: "p", parent: panel.htmlElement, content: detailsText ?? "",classes: ["details"] });
        requestAnimationFrame(() => {
            header.htmlElement.classList.add("appear");
        });
        await sleep(500);
        title.htmlElement.classList.add("appear");
        details.htmlElement.classList.add("appear");
        await sleep(5000);
        panel.htmlElement.classList.remove("appear");
        await sleep(3000);
        panel.remove();
        game.milestones.displayQuests();
        game.score.add(this.reward);
    }
}

export class MilestoneManager {
    milestones: Milestone[] = [];
    questList!: UIElement;
    questContainer!: UIElement;
    constructor() {
    }
    init() {
        this.questContainer = UIElement.create({ type: "div", classes: ["quest-list"], parent: UI.container, content: `<h1>Tier 1 Milestones</h1>` });
        this.questList = UIElement.create({ type: "div", parent: this.questContainer.htmlElement });

        const findSeedMilestone = new Milestone("Find a seed");
        const plantMilestone = new Milestone("Plant a seed", 200);
        const plantGrowMilestone = new Milestone("Fully grow a plant", 2000);
        game.events.on("playerBuild", entity => {
            if (entity.getComponent(Plant)) plantMilestone.complete(`You planted a ${entity.getComponent(Plant)!.species.name}`);
        })
        game.events.on("plantGrow", plant => {
            plantGrowMilestone.complete(`${plant.species.name} has grown to maturity`);
        })
        this.displayQuests();
    }
    displayQuests() {
        this.questList.htmlElement.innerHTML = "";
        for (const milestone of this.milestones) {
            if (!milestone.completed) {
                const quest = UIElement.create({ type: "div", classes: ["quest"], parent: this.questList.htmlElement, content: `<p>${milestone.name}</p>` });
            }
        }
    }
}