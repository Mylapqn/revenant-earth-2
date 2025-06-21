import { Game, game } from "../game";
import { UIContextMenu } from "./uiContextMenu";
import { UIElement } from "./uiElement";
import { UIFullscreenMenu } from "./uiFullscreenMenu";
import { UIControlPrompts } from "./uiControlPrompts";
import { UIQuickInventory } from "./uiQuickInventory";

export class UI {
    static container: HTMLDivElement;
    static mouseOverElements: Set<UIElement> = new Set();
    static quickInventory?: UIQuickInventory;
    static fullscreenMenu: UIFullscreenMenu;
    static controlPrompts: UIControlPrompts;
    static customElement<T = HTMLElement>(type: string, parent: HTMLElement, ...classes: string[]): T {
        const element = document.createElement(type);
        element.classList.add(...classes);
        parent.appendChild(element);
        return element as T;
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
    static init() {
        UI.container = UI.customDiv(document.body, "uiContainer");
        UI.fullscreenMenu = new UIFullscreenMenu();
        UI.controlPrompts = new UIControlPrompts(this.container);
        //setTimeout(() => UI.fullscreenMenu.toggle(true), 100);
        UI.mouseOverElements = new Set();
        UI.quickInventory = new UIQuickInventory();
    }
    static destroy() {
        UI.container.remove();
        UI.fullscreenMenu.htmlElement.remove();
        UI.controlPrompts.remove();
    }
    static get isMouseOverUI() {
        return UI.mouseOverElements.size > 0;
    }
    static mouseOnElement(element: UIElement) {
        UI.mouseOverElements.add(element);
    }
    static mouseOffElement(element: UIElement) {
        UI.mouseOverElements.delete(element);
    }
}
