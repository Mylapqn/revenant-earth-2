import { game } from "../game";
import { UI } from "./ui";
import { TooltipID } from "./uiTooltipData";

export class UIElement<T extends HTMLElement = HTMLElement> {
    public htmlElement: T;
    public parent?: UIElement;
    public children: UIElement[];
    mouseSoundEffects = false;
    blockMouse = true;
    tooltipData?: TooltipID
    onclick?: () => void;
    constructor(options: UIElementOptions) {
        this.children = [];
        this.htmlElement = document.createElement(options.type) as T;
        if (options.classes)
            this.htmlElement.classList.add(...options.classes);
        this.onclick = options.onclick;
        this.mouseSoundEffects = options.mouseSoundEffects ?? false;
        this.blockMouse = (options.blockMouse ?? false);
        this.tooltipData = options.tooltip
        if (this.blockMouse || this.mouseSoundEffects || this.tooltipData) {
            this.htmlElement.addEventListener("mouseenter", () => {
                if (this.mouseSoundEffects) game.soundManager.play("hover");
                if (this.blockMouse) {
                    UI.mouseOnElement(this);
                }
                if (this.tooltipData) game.tooltipManager.addTooltip(this.tooltipData);
            });
            this.htmlElement.addEventListener("mouseleave", () => {
                if (this.blockMouse) {
                    UI.mouseOffElement(this);
                }
                if (this.tooltipData) game.tooltipManager.removeTooltip(this.tooltipData);
            });
        }
        if (this.onclick || this.mouseSoundEffects) {
            this.htmlElement.addEventListener("click", () => {
                if (this.mouseSoundEffects) game.soundManager.play("click");
                if (this.onclick)
                    this.onclick();
            });
        }
        if (options.content) this.htmlElement.innerHTML = options.content;
        options.parent?.appendChild(this.htmlElement);
    }
    remove() {
        while (this.children.length > 0) {
            this.children[0].remove();
        }
        this.htmlElement.remove();
        if (this.blockMouse) UI.mouseOffElement(this);
        if (this.parent) {
            this.parent.children.splice(this.parent.children.indexOf(this), 1);
        }
    }
    addChild(...uielement: UIElement[]) {
        for (const element of uielement) {
            this.htmlElement.appendChild(element.htmlElement);
            element.parent = this;
            this.children.push(element);
        }
    }
    /** @deprecated Use `new UIElement(options)` instead. */
    static create<T extends HTMLElement>(options: UIElementOptions): UIElement<T> {
        console.warn("new UIElement is deprecated. Use `new UIElement(options)` instead.");
        return new UIElement<T>(options);
    }
}
export type UIElementOptions = { type: string; classes?: string[]; parent?: HTMLElement; content?: string; mouseSoundEffects?: boolean; blockMouse?: boolean; onclick?: () => void; tooltip?: TooltipID };

