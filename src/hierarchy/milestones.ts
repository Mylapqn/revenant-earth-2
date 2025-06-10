import { Plant } from "../components/custom/plant";
import { game } from "../game";
import { UI, UIElement, UIPanel } from "../ui/ui";
import { sleep } from "../utils/utils";

export class Milestone {
    private _completed = false;
    public get completed() {
        return this._completed;
    }
    constructor(public name: string) {
        game.milestones.milestones.push(this);
    }
    async complete() {
        if (this._completed) return;
        this._completed = true;
        game.soundManager.soundLibrary.play("milestone");
        const panel = UIElement.create({ type: "div", classes: ["milestone", "appear"], parent: UI.container, content: `` });
        const header = UIElement.create({ type: "p", parent: panel.htmlElement, content: "Milestone achieved" });
        const title = UIElement.create({ type: "h1", parent: panel.htmlElement, content: this.name });
        requestAnimationFrame(() => {
            header.htmlElement.classList.add("appear");
        });
        await sleep(500);
        title.htmlElement.classList.add("appear");
        await sleep(3000);
        panel.htmlElement.classList.remove("appear");
        await sleep(3000);
        panel.remove();
    }
}

export class MilestoneManager {
    milestones: Milestone[] = [];
    init() {
        const treeMilestone = new Milestone("Plant a tree");
        game.events.on("playerBuild", entity => {
            if (entity.getComponent(Plant)) treeMilestone.complete();
        })
    }
}