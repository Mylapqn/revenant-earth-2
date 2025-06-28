import { CSSClassAnimation } from "../animations/CSSClassAnimation";
import { GenericAnimation } from "../animations/genericAnimation";
import { game } from "../game";
import { sleep } from "../utils/utils";
import { UI } from "./ui";
import { UIElement } from "./uiElement";
import { UIFullscreenTab } from "./uiFullscreenTab";

export class UIFullscreenTabMenu {
    visible: boolean = false;
    htmlElement: HTMLElement;
    parentElement: UIElement;
    centerTab: UIElement;
    leftTab: UIElement;
    rightTab: UIElement;
    farLeftTab: UIElement;
    farRightTab: UIElement;
    titlePanel: UIElement;
    tabs: UIFullscreenTab[] = [];
    constructor() {
        this.parentElement = new UIElement<HTMLDivElement>({ type: "div", classes: ["fullscreen-tab-menu"], parent: document.body, blockMouse: true });
        this.htmlElement = this.parentElement.htmlElement;
        this.titlePanel = new UIElement({ type: "div", classes: ["tab-title-panel"], parent: this.htmlElement });
        this.leftTab = new UIElement({ type: "h1", classes: ["tab-title", "left"], parent: this.titlePanel.htmlElement, content: "Inventory" });
        this.centerTab = new UIElement({ type: "h1", classes: ["tab-title", "center"], parent: this.titlePanel.htmlElement, content: "Terraforming" });
        this.rightTab = new UIElement({ type: "h1", classes: ["tab-title", "right"], parent: this.titlePanel.htmlElement, content: "Ranking" });
        this.farLeftTab = new UIElement({ type: "h1", classes: ["tab-title", "far-left"], parent: this.titlePanel.htmlElement, content: "Settings" });
        this.farRightTab = new UIElement({ type: "h1", classes: ["tab-title", "far-right"], parent: this.titlePanel.htmlElement, content: "Help" });
        this.tabs.push(new UIFullscreenTab("Terraforming", document.createElement("div")));
        this.htmlElement.addEventListener("click", () => this.nextTab());
    }
    toggle(show: boolean = !this.visible) {
        if (show) {
            game.animator.play(this, CSSClassAnimation.showAnimation(this.htmlElement, 300));
            this.visible = true;
        }
        else {
            game.animator.play(this, CSSClassAnimation.hideAnimation(this.htmlElement, 300));
            this.visible = false;
            UI.mouseOffElement(this.parentElement);
        }
    }
    async nextTab() {
        await game.animator.play(this, new GenericAnimation({
            duration: 1000,
            before: () => {
                this.farLeftTab.htmlElement.classList.remove("far-left");
                this.farRightTab.htmlElement.classList.remove("far-right");
                this.leftTab.htmlElement.classList.remove("left");
                this.centerTab.htmlElement.classList.remove("center");
                this.rightTab.htmlElement.classList.remove("right");
                this.farLeftTab.htmlElement.classList.add("far-right");
                this.farRightTab.htmlElement.classList.add("right");
                this.leftTab.htmlElement.classList.add("far-left");
                this.centerTab.htmlElement.classList.add("left");
                this.rightTab.htmlElement.classList.add("center");
                const temp = this.farLeftTab;
                this.farLeftTab = this.leftTab;
                this.leftTab = this.centerTab;
                this.centerTab = this.rightTab;
                this.rightTab = this.farRightTab;
                this.farRightTab = temp;
            }
        }))
        this.farLeftTab.htmlElement.style.order = "0";
        this.leftTab.htmlElement.style.order = "1";
        this.centerTab.htmlElement.style.order = "2";
        this.rightTab.htmlElement.style.order = "3";
        this.farRightTab.htmlElement.style.order = "4";

    }
    renderProgress() { }
    renderItems() { }
    renderItem() { }
}