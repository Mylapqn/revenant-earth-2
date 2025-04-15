import { EntityTooltip } from "../components/generic/entityTooltip";
import { game } from "../game";
import { Entity } from "../hierarchy/entity";
import { UI } from "./ui";

export class UITooltip {
    parentElement: HTMLDivElement;
    enabled: boolean = false;
    hoveredEntity?: Entity = undefined;
    timeSinceLastUpdate = 0;
    timePerEntityUpdate = .1;
    constructor() {
        this.parentElement = document.createElement("div");
        this.parentElement.id = "tooltip";
        document.body.appendChild(this.parentElement);
    }
    update(dt: number) {
        this.timeSinceLastUpdate += dt;
        if (this.timeSinceLastUpdate > this.timePerEntityUpdate) {
            this.timeSinceLastUpdate %= this.timePerEntityUpdate;
            if (this.hoveredEntity) {
                this.hover(this.hoveredEntity.getComponent(EntityTooltip)!.getTooltip());
            }
            else {
                this.hover();
            }
        }
        this.parentElement.style.left = `${game.input.mouse.position.x + 10}px`;
        this.parentElement.style.top = `${game.input.mouse.position.y + 10}px`;
    }

    hoverEntity(entity: Entity, hover: boolean) {
        if (hover) {
            this.hoveredEntity = entity;
            this.hover(entity.getComponent(EntityTooltip)!.getTooltip());

        }
        else if (this.hoveredEntity == entity) {
            this.hoveredEntity = undefined;
            this.hover();
        }
    }
    hover(...data: TooltipPanel[]) {
        this.parentElement.innerHTML = "";
        if (data && data.length > 0) {
            this.enabled = true;
            this.parentElement.style.display = "flex";
            if (data.length == 1) {
                //Simple layout
                if (data[0].title) {
                    const titleElement = UI.customDiv(this.parentElement, "panel", "title");
                    const h1 = UI.customElement("h1", titleElement);
                    h1.innerText = data[0].title;
                }
                if (data[0].text) {
                    const textElement = UI.customDiv(this.parentElement, "panel");
                    textElement.innerText = data[0].text;
                }
                return;
            }
            for (const panel of data) {
                //Complex layout
                this.processPanel(this.parentElement, panel);
            }
        }
        else {
            this.enabled = false;
            this.parentElement.style.display = "none";
        }
    }
    processPanel(parentElement: HTMLDivElement, data: TooltipPanel) {
        const panelElement = UI.customDiv(parentElement, "panel");
        if (data.title) {
            const titleElement = UI.customElement("h1", panelElement);
            titleElement.innerText = data.title;
            if (!data.text && !data.columns) panelElement.classList.add("title");
        }
        if (data.text) {
            const textElement = UI.customElement("p", panelElement);
            textElement.innerText = data.text;
        }
        if (data.columns) {
            panelElement.classList.add("columns");
            for (const column of data.columns) {
                this.processPanel(panelElement, column);
            }
        }
        if(data.highlight){
            panelElement.classList.add("highlight");
        }
        return panelElement;
    }
}

export type TooltipPanel = {
    title?: string;
    text?: string;
    columns?: TooltipPanel[];
    highlight?: boolean;
}