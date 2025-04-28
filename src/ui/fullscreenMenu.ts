import { UI } from "./ui";

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