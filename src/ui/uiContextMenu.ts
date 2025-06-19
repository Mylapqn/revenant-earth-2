import { game } from "../game";
import { Vector } from "../utils/vector";
import { UI } from "./ui";
import { UIElement } from "./uiElement";


export class UIContextMenu extends UIElement {
    static current?: UIContextMenu;
    static currentLocation: Vector = new Vector();
    public mouseLeft = true;
    constructor(...uiElement: UIElement[]) {
        super({ type: "div", parent: UI.container, classes: ["drop-menu", "basic"] });
        if (UIContextMenu.current) {
            UIContextMenu.current.remove();
        }
        UIContextMenu.current = this;

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
