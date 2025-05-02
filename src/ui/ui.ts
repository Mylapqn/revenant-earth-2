import { Debug } from "../dev/debug";
import { game } from "../game";
import { UIContextMenu } from "./contextMenu";
import { UIFullscreenMenu } from "./fullscreenMenu";
import { UIElement } from "./uiElement";

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

