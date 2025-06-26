import { nextFrame, sleep } from "../utils/utils";
import { Animation } from "./animator";


export class CSSClassAnimation implements Animation {
    private cancelled = false;
    private element: HTMLElement;

    constructor(
        element: HTMLElement,
        private config: {
            addClass?: string;
            removeClass?: string;
            duration: number;
            before?: (el: HTMLElement) => Promise<void> | void;
            after?: (el: HTMLElement) => Promise<void> | void;
        }
    ) {
        this.element = element;
    }

    _cancel() {
        this.cancelled = true;
        if (this.config.addClass) this.element.classList.remove(this.config.addClass);
        if (this.config.removeClass) this.element.classList.add(this.config.removeClass);
    }

    async _start(): Promise<boolean> {
        if (this.cancelled) return false;

        if (this.config.before) {
            await this.config.before?.(this.element);
            await nextFrame();
        }

        if (this.cancelled) return false;

        if (this.config.addClass) this.element.classList.add(this.config.addClass);
        if (this.config.removeClass) this.element.classList.remove(this.config.removeClass);
        this.element.style.transitionDuration = this.config.duration + "ms";

        await nextFrame();
        if (this.cancelled) return false;

        await sleep(this.config.duration);
        if (this.cancelled) return false;

        await this.config.after?.(this.element);
        if (this.cancelled) return false;
        return true;
    }

    static showAnimation(element: HTMLElement, duration = 500) {
        return new CSSClassAnimation(element, { addClass: "appear", duration, before: (el) => { el.style.display = "flex" } });
    }
    static hideAnimation(element: HTMLElement, duration = 500) {
        return new CSSClassAnimation(element, { removeClass: "appear", duration, after: (el) => { el.style.display = "none" } });
    }
}
