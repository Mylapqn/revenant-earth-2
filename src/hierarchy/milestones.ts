import { Plant } from "../components/custom/plant";
import { game } from "../game";
import { UI, UIElement, UIPanel } from "../ui/ui";
import { sleep } from "../utils/utils";

export type SubMilestoneOptions = {
    id: string,
    name: string,
    reward: number,
    parent?: Milestone
};

export type MilestoneOptions = SubMilestoneOptions & {
    tier?: number,
    subTasks?: SubMilestoneOptions[],
};

export class Milestone {
    reward = 0;
    private _completed = false;
    tier: number;
    name: string;
    parent?: Milestone;
    children: Milestone[] = [];
    id: string;
    public get completed() {
        return this._completed;
    }
    constructor(options: MilestoneOptions) {
        this.id = options.id;
        this.name = options.name;
        this.tier = options.tier ?? 0;
        const reward = options.reward;
        this.parent = options.parent;
        if (this.parent) {
            this.tier = this.parent.tier;
        }
        if (options.subTasks) this.children = options.subTasks.map(task => {
            task.parent = this;
            return new Milestone(task);
        });
        game.milestones.milestones.set(this.id, this);
        this.reward = reward ?? 0;
    }
    async complete(detailsText?: string) {
        if (this._completed) return;
        this._completed = true;
        game.soundManager.soundLibrary.play("milestone");
        const panel = UIElement.create({ type: "div", classes: ["milestone", "appear"], parent: UI.container, content: `` });
        const header = UIElement.create({ type: "p", parent: panel.htmlElement, content: "Milestone achieved" });
        const title = UIElement.create({ type: "h1", parent: panel.htmlElement, content: this.name });
        const details = UIElement.create({ type: "p", parent: panel.htmlElement, content: detailsText ?? "", classes: ["details"] });
        requestAnimationFrame(() => {
            header.htmlElement.classList.add("appear");
        });
        await sleep(500);
        title.htmlElement.classList.add("appear");
        details.htmlElement.classList.add("appear");
                game.score.addWithFx(this.reward,{x:.5,y:.15});
        await sleep(5000);
        panel.htmlElement.classList.remove("appear");
        await sleep(3000);
        panel.remove();
        game.milestones.displayQuests();
        this.parent?.checkChildren();
    }
    checkChildren() {
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
    constructor() {
    }
    init() {
        this.questContainer = UIElement.create({ type: "div", classes: ["quest-list"], parent: UI.container, content: `<h1>Tier 1 Milestones</h1>` });
        this.questList = UIElement.create({ type: "div", parent: this.questContainer.htmlElement });

        const plantQuest = new Milestone({
            name: "The first plant", id: "firstPlant", reward: 1000, tier: 0, subTasks: [
                { name: "Find a seed", id: "findSeed", reward: 100 },
                { name: "Plant a seed", id: "plantSeed", reward: 100 },
                { name: "Fully grow a plant", id: "growPlant", reward: 100 },
            ]
        });
        game.events.on("playerBuild", entity => {
            if (entity.getComponent(Plant)) this.completeQuest("plantSeed", `You planted a ${entity.getComponent(Plant)!.species.name}`);
        })
        game.events.on("plantGrow", plant => {
            this.completeQuest("growPlant", `${plant.species.name} has grown to maturity`);
        })
        this.displayQuests();
    }
    displayQuests() {
        this.questList.htmlElement.innerHTML = "";
        for (const milestone of this.milestones.values()) {
            if (!milestone.completed && milestone.parent == undefined) {
                const quest = UIElement.create({ type: "div", classes: ["quest"], parent: this.questList.htmlElement, content: `<p>${milestone.name}</p>` });
                for (const sub of milestone.children) {
                    if (sub.completed) continue;
                    const subQuest = UIElement.create({ type: "div", classes: ["sub-quest"], parent: quest.htmlElement, content: `<p>${sub.name}</p>` });
                }
            }
        }
    }
    getQuest(id: string) { return this.milestones.get(id); }
    completeQuest(id: string, detailsText?: string) { this.milestones.get(id)?.complete(detailsText); }
}