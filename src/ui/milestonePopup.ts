import { game } from "../game";
import { sleep } from "../utils/utils";
import { UIElement, UI } from "./ui";

type QuestPopupOptions = { type: "issue" | "complete", questName: string, detailsText?: string, reward?: number };

export class MilestonePopupManager {
    popupQueue: QuestPopupOptions[] = [];
    currentPopup?: UIElement;

    update() {
        if (this.currentPopup == undefined && this.popupQueue.length > 0) {
            const options = this.popupQueue.shift()!;
            this.questPopup(options);
        }
    }
    add(options: QuestPopupOptions) {
        this.popupQueue.push(options);
    }
    async questPopup(options: QuestPopupOptions) {
        if (options.type == "complete") this.questCompletePopup(options);
        else if (options.type == "issue") this.questIssuePopup(options);
    }
    async questCompletePopup(options: QuestPopupOptions) {
        const waitMult = 1;
        game.soundManager.soundLibrary.play("milestone", { singleInstance: true });

        const panel = UIElement.create({ type: "div", classes: ["milestone"], parent: UI.container, content: `` });
        this.currentPopup = panel;
        const header = UIElement.create({ type: "p", parent: panel.htmlElement, content: "Milestone achieved" });
        const title = UIElement.create({ type: "h1", parent: panel.htmlElement, content: options.questName });
        const details = UIElement.create({ type: "p", parent: panel.htmlElement, content: options.detailsText ?? "", classes: ["details"] });
        requestAnimationFrame(() => {
            panel.htmlElement.classList.add("appear");
            header.htmlElement.classList.add("appear");
        });

        await sleep(500 * waitMult);
        title.htmlElement.classList.add("appear");
        details.htmlElement.classList.add("appear");
        if (options.reward && options.reward != 0)
            game.score.addWithFx(options.reward, { x: .5, y: .15 });

        await sleep(4000 * waitMult);

        panel.htmlElement.classList.remove("appear");
        await sleep(3000);

        panel.remove();
        this.currentPopup = undefined;
    }
    async questIssuePopup(options: QuestPopupOptions) {
        const waitMult = 1;
        game.soundManager.soundLibrary.play("quest_issue", { singleInstance: true, volume: 0.2 });

        const panel = UIElement.create({ type: "div", classes: ["milestone", "issue"], parent: UI.container, content: `` });
        this.currentPopup = panel;
        const header = UIElement.create({ type: "p", parent: panel.htmlElement, content: "Task issued" });
        const title = UIElement.create({ type: "h1", parent: panel.htmlElement, content: options.questName });
        const details = UIElement.create({ type: "p", parent: panel.htmlElement, content: options.detailsText ?? "", classes: ["details"] });
        requestAnimationFrame(() => {
            panel.htmlElement.classList.add("appear");
            header.htmlElement.classList.add("appear");
        });

        await sleep(300 * waitMult);

        title.htmlElement.classList.add("appear");
        details.htmlElement.classList.add("appear");
        if (options.reward && options.reward != 0)
            game.score.addWithFx(options.reward, { x: .5, y: .15 });

        await sleep(4000 * waitMult);

        panel.htmlElement.classList.remove("appear");
        await sleep(1000);

        panel.remove();
        this.currentPopup = undefined;
    }
}