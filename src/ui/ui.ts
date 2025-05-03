import { Debug } from "../dev/debug";
import { game } from "../game";
import { Vector } from "../utils/vector";

export class UI {
    static container: HTMLDivElement;
    static mouseOverUI = 0;
    static lastHoveredElement?: UIElement;
    static customElement(type: string, parent: HTMLElement, ...classes: string[]) {
        const element = document.createElement(type);
        element.classList.add(...classes);
        parent.appendChild(element);
        return element;
    }
    static customDiv(parent: HTMLElement, ...classes: string[]) {
        return UI.customElement("div", parent, ...classes) as HTMLDivElement;
    }
    static update() {
        if (game.input.mouse.movedThisFrame()) {
            if (UIContextMenu.current) {
                if (UIContextMenu.currentLocation.distance(game.input.mouse.position) > 50 && UIContextMenu.current.mouseLeft) {
                    UIContextMenu.current.remove();
                }
            }
        }
    }
    static init(){
        UI.container = UI.customDiv(document.body, "uiContainer");
        UI.fullscreenMenu = new UIFullscreenMenu();
    }
    static fullscreenMenu:UIFullscreenMenu;
}

export class UIElement {
    public htmlElement: HTMLElement;
    public parent?: UIElement;
    public children: UIElement[];
    constructor(type: string, ...classes: string[]) {
        this.children = [];
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

export class UIPanel extends UIElement {

    constructor() {
        super("div");
    }
}

export class UIFullscreenMenu {
    element: HTMLDivElement;
    shown = false;
    constructor() {
        this.element = UI.customDiv(document.body, "fullscreenMenu");
        const bg = UI.customDiv(this.element, "menuBG");
        const border = UI.customDiv(bg, "menuBorder");
        const pattern = UI.customDiv(border, "menuPattern");
        const title = UI.customDiv(this.element, "menuTitle");
        title.innerText = "Revenant Earth 2";
    }
    toggle(show?: boolean) {
        if (show === undefined) show = !this.shown;
        if (show) {
            this.element.classList.add("menuAppear");
            this.element.classList.remove("menuHide");
            this.shown = true;
        }
        else {
            this.element.classList.add("menuHide");
            this.element.classList.remove("menuAppear");
            this.shown = false;
        }
    }
}

export class UIContextMenu extends UIPanel {
    static current?: UIContextMenu;
    static currentLocation: Vector = new Vector();
    public mouseLeft = true;
    constructor(...uiElement: UIElement[]) {
        super();

        if (UIContextMenu.current) {
            UIContextMenu.current.remove();
        }
        UIContextMenu.current = this;

        UI.container.appendChild(this.htmlElement);
        this.htmlElement.classList.add("drop-menu", "basic");
        this.htmlElement.style.position = "absolute";
        this.htmlElement.style.top = game.input.mouse.position.y + "px";
        this.htmlElement.style.left = game.input.mouse.position.x + "px";
        UIContextMenu.currentLocation = game.input.mouse.position.clone();
        this.htmlElement.style.zIndex = "10";

        this.htmlElement.addEventListener("mouseleave", () => {
            this.mouseLeft = true;
        });
        this.htmlElement.addEventListener("mouseenter", () => {
            this.mouseLeft = false;
        });

        this.htmlElement.addEventListener("click", () => {
            this.remove();
        });

        if (uiElement.length > 0) {
            this.addChild(...uiElement);
        }

    }
    remove() {
        UIContextMenu.current = undefined;
        super.remove();
    }
}

