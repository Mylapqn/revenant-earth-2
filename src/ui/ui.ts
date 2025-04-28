import { UIFullscreenMenu } from "./fullscreenMenu";

export class UI {
    static customElement(type: string, parent: HTMLElement, ...classes: string[]) {
        const element = document.createElement(type);
        element.classList.add(...classes);
        parent.appendChild(element);
        return element;
    }
    static customDiv(parent: HTMLElement, ...classes: string[]) {
        return UI.customElement("div", parent, ...classes) as HTMLDivElement;
    }
    static fullscreenMenu:UIFullscreenMenu;
}