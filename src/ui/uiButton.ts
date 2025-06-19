import { UIElement } from "./uiElement";

export class UIButton extends UIElement {
    constructor(label: string = "Button", onclick?: () => void) {
        super({ type: "button", classes: ["basic"], content: label, onclick: onclick });
    }
}