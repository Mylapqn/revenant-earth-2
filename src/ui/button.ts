import { UIElement } from "./uiElement";

export class UIButton extends UIElement {
    constructor(label: string = "Button", onclick?: () => void) {
        super("button");
        this.htmlElement.classList.add("basic");
        this.htmlElement.innerText = label;
        if (onclick) {
            this.onClick = onclick;
        }
        this.htmlElement.addEventListener("click", this.onClick.bind(this));
    }
    public onClick: () => void = () => { };
}