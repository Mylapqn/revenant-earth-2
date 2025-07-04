import { text } from "express";
import { game } from "../game";
import { ISceneObject, Scene } from "../hierarchy/scene";
import { ISerializable, KindedObject, StateMode } from "../hierarchy/serialise";
import { Vector } from "../utils/vector";
import { UI } from "./ui";
import { UIElement } from "./uiElement";
import { TooltipID, UITooltipData } from "./uiTooltipData";

export class UITooltipManager {
    list: Map<TooltipID, UITooltip>
    constructor() {
        this.list = new Map<TooltipID, UITooltip>();
    }
    update(dt: number) {
        for (const tooltip of this.list.values()) {
            tooltip.update(dt);
        }
    }

    addTooltip(data: TooltipID) {
        if (this.list.has(data)) return this.list.get(data)!;
        const tooltip = new UITooltip({ tooltipData: data });
        this.list.set(data, tooltip);
        return tooltip;
    }
    removeTooltip(data: TooltipID) {
        if (!this.list.has(data)) return;
        const tooltip = this.list.get(data)!;
        tooltip.removeUnlocked();
    }
}

export class UITooltip {
    uiElement: UIElement<HTMLDivElement>;
    htmlElement: HTMLDivElement;
    timerBar: HTMLDivElement;
    lockTimer = 0;
    locked = false;
    position: Vector;
    dataID: TooltipID;
    mouseEntered = false;
    removeWhenUnlocked = false;
    lockable = false;
    constructor(options: { text?: string, tooltipData: TooltipID }) {
        this.dataID = options.tooltipData;
        this.uiElement = new UIElement<HTMLDivElement>({ type: "div", parent: UI.container, classes: ["tooltip"], blockMouse: true });
        this.htmlElement = this.uiElement.htmlElement;

        let text = options.text ?? "";
        if (options.tooltipData) text = UITooltipData.data[options.tooltipData];
        this.htmlElement.innerHTML = text;
        const bChildren = this.htmlElement.querySelectorAll("b");
        for (const child of bChildren) {
            if (child.getAttribute("tooltip")) {
                child.classList.add("tooltip-link");
                child.addEventListener("mouseenter", () => game.tooltipManager.addTooltip(child.getAttribute("tooltip")! as unknown as TooltipID));
                child.addEventListener("mouseleave", () => game.tooltipManager.removeTooltip(child.getAttribute("tooltip")! as unknown as TooltipID));
            }
        }

        this.timerBar = new UIElement<HTMLDivElement>({ type: "div", parent: this.uiElement.htmlElement, classes: ["tooltip-progress-bar"] }).htmlElement;
        this.position = new Vector();

        //TODO determine from content
        this.lockable = true;
    }

    update(dt: number) {
        const lockDelay = 1;
        const offset = 10;
        const diff = this.position.diff(game.input.mouse.position).lengthSquared();
        if (!this.locked) {
            if (diff > 0.1) {
                this.position = game.input.mouse.position.clone();
                this.htmlElement.style.left = "";
                this.htmlElement.style.top = "";
                this.htmlElement.style.right = "";
                this.htmlElement.style.bottom = "";
                if (this.position.y > window.innerHeight - 200) this.htmlElement.style.bottom = `${window.innerHeight - this.position.y + offset}px`;
                else this.htmlElement.style.top = `${this.position.y + offset}px`;
                if (this.position.x > window.innerWidth - 200) this.htmlElement.style.right = `${window.innerWidth - this.position.x + offset}px`;
                else this.htmlElement.style.left = `${this.position.x + offset}px`;
                this.lockTimer = 0;
            }
            else if (this.lockable) {
                this.lockTimer += dt;
                if (this.lockTimer > lockDelay) {
                    this.lock();
                }
            }
            this.timerBar.style.width = `${this.lockTimer / lockDelay * 100}%`;
        }
        else {
            if (!this.mouseEntered) {
                if (diff > 50 * 50) {
                    this.unlock();
                }
            }
        }
    }

    lock() {
        this.timerBar.style.width = `${0}%`;
        this.locked = true;
        this.lockTimer = 0;
        this.htmlElement.classList.add("locked");
        this.htmlElement.addEventListener("mouseleave", () => this.remove());
        this.htmlElement.addEventListener("mouseenter", () => { this.mouseEntered = true; });
    }

    unlock() {
        if (this.removeWhenUnlocked) {
            this.remove();
        }
        else {
            this.lockTimer = 0;
            this.locked = false;
            this.htmlElement.classList.remove("locked");
            this.htmlElement.removeEventListener("mouseleave", () => this.remove());
            this.htmlElement.removeEventListener("mouseenter", () => { this.mouseEntered = true; });
        }
    }

    remove() {
        this.uiElement.remove();
        game.tooltipManager.list.delete(this.dataID);
    }

    removeUnlocked() {
        if (!this.locked) {
            this.remove();
        }
        else {
            this.removeWhenUnlocked = true;
        }
    }
}

