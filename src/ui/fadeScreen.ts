import { nextFrame, sleep } from "../utils/utils";
import { UIElement } from "./ui";

export class FadeScreen {
    static element: HTMLElement;
    static inProgress = false;
    static init(){
        this.element = UIElement.create({ type: "div", classes: ["fade-screen"], parent: document.body }).htmlElement;
        this.element.style.display = "none";
    }
    private static setFadeDuration(duration: number){
        this.element.style.transitionDuration = duration + "ms";
    }
    static async fadeIn(duration = 1000) {
        this.inProgress = true;
        this.setFadeDuration(duration);
        this.element.style.display = "flex";
        await nextFrame();
        this.element.classList.add("appear");
        await sleep(duration);
    }
    static async fadeOut(duration = 1000) {
        this.element.classList.add("appear");
        this.setFadeDuration(duration);
        await nextFrame();
        this.element.classList.remove("appear");
        await sleep(duration);
        this.element.style.display = "none";
        this.inProgress = false;
    }
    static async fadeInOut(fadeDuration = 1000, stayDuration = 1000) {
        await this.fadeIn(fadeDuration);
        await sleep(stayDuration);
        await this.fadeOut(fadeDuration);
    }
}