import { game } from "../game";
import { Vector } from "../utils/vector";
import { UIPanel } from "./panel";
import { UI } from "./ui";
import { UIElement } from "./uiElement";

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
        UIContextMenu.currentLocation = game.input.mouse.position.result();
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