import { UI } from "./ui";


export class UIElement {
    public htmlElement: HTMLElement;
    public parent?: UIElement;
    public children: UIElement[] = [];
    constructor(type: string, ...classes: string[]) {
        this.htmlElement = document.createElement(type);
        this.htmlElement.classList.add(...classes);
        this.htmlElement.addEventListener("mouseenter", () => {
            UI.mouseOverUI++;
            UI.lastHoveredElement = this;
        });
        this.htmlElement.addEventListener("mouseleave", () => {
            UI.mouseOverUI = UI.mouseOverUI > 0 ? UI.mouseOverUI - 1 : 0;
            console.log("mouse leave", UI.mouseOverUI);
            if (UI.mouseOverUI == 0)
                UI.lastHoveredElement = undefined;
        });
    }
    remove() {
        while (this.children.length > 0) {
            this.children[0].remove();
        }
        if (this == UI.lastHoveredElement) {
            UI.lastHoveredElement = this.parent;
            UI.mouseOverUI--;
        }
        if (this.parent) {
            this.parent.children.splice(this.parent.children.indexOf(this), 1);
        }
        this.htmlElement.remove();
    }
    addChild(...uielement: UIElement[]) {
        for (const element of uielement) {
            this.htmlElement.appendChild(element.htmlElement);
            element.parent = this;
            this.children.push(element);
        }
    }
}
