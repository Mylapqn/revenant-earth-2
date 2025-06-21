import { UI } from "./ui";
import { UIElement } from "./uiElement";

export class UIProgressBar {
    private barElement: HTMLDivElement;
    private fillElement: HTMLDivElement;
    private textElement: HTMLElement;
    private containerElement: HTMLDivElement;
    name: string
    private _progress = 0;
    public get progress(): number {
        return this._progress;
    }
    public set progress(value: number) {
        this._progress = value;
        this.fillElement.style.width = `${value * 100}%`;
    }

    constructor(name: string, parent: HTMLElement) {
        this.containerElement = UI.customDiv(parent, "progressBar");
        this.name = name;
        this.textElement = new UIElement({ type: "div", parent: this.containerElement, classes: ["text"], content: name }).htmlElement;
        this.barElement = UI.customDiv(this.containerElement, "bar");
        this.fillElement = UI.customDiv(this.barElement, "fill");
    }
}