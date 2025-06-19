import { game } from "../game";
import { Vector } from "../utils/vector";
import { UIElement, UIElementOptions } from "./uiElement";


export class UIAbsoluteElement extends UIElement {
    constructor(options: UIElementOptions & { worldPosition: Vector; }) {
        super(options);
        this.htmlElement.style.position = "absolute";
        this.setWorldPosition(options.worldPosition);
    }
    setWorldPosition(position: Vector) {
        if (game.camera.inViewX(position.x, 200)) {
            const screenPos = game.camera.worldToScreen(position);
            this.htmlElement.style.display = "";
            this.htmlElement.style.left = screenPos.x + "px";
            this.htmlElement.style.top = screenPos.y + "px";
        }
        else {
            this.htmlElement.style.display = "none";
        }
    }
    setRenderPosition(position: Vector) {
        this.htmlElement.style.display = "";
        this.htmlElement.style.left = position.x * 100 + "%";
        this.htmlElement.style.top = position.y * 100 + "%";
    }
    setScreenPosition(position: Vector) {
        this.htmlElement.style.display = "";
        this.htmlElement.style.left = position.x + "px";
        this.htmlElement.style.top = position.y + "px";
    }
}
