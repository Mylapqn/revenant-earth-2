import { TooltipComponent } from "./components/generic/tooltipComponent";
import { game } from "./game";
import { Entity } from "./hierarchy/entity";

export class Tooltip {
    htmlElement: HTMLDivElement;
    enabled: boolean = false;
    hoveredEntity?: Entity = undefined;
    timeSinceLastUpdate = 0;
    timePerEntityUpdate = .1;
    constructor() {
        this.htmlElement = document.createElement("div");
        this.htmlElement.id = "tooltip";
        document.body.appendChild(this.htmlElement);
    }
    update(dt: number) {
        this.timeSinceLastUpdate += dt;
        if (this.timeSinceLastUpdate > this.timePerEntityUpdate) {
            this.timeSinceLastUpdate %= this.timePerEntityUpdate;
            this.hover(this.hoveredEntity?.getComponent(TooltipComponent)?.getTooltip());
        }
        this.htmlElement.style.left = `${game.input.mouse.position.x + 10}px`;
        this.htmlElement.style.top = `${game.input.mouse.position.y + 10}px`;
    }

    hoverEntity(entity: Entity, hover: boolean) {
        if (hover) {
            this.hoveredEntity = entity;
            this.hover(entity.getComponent(TooltipComponent)?.getTooltip());

        }
        else if (this.hoveredEntity == entity) {
            this.hoveredEntity = undefined;
            this.hover();
        }
    }
    hover(text?: string) {
        if (text) {
            this.enabled = true;
            this.htmlElement.innerText = text;
            this.htmlElement.style.display = "flex";
        }
        else {
            this.enabled = false;
            this.htmlElement.style.display = "none";
        }
    }
}