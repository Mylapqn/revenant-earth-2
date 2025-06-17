import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { EntityTooltip } from "../generic/entityTooltip";
import { Interactable } from "../generic/interactable";
import { Power } from "../generic/power";

export class SprinklerCore extends Component {
    static componentType = "SprinklerCore";
    constructor(entity: Entity) {
        super(entity);
        this.onEntity("interact", () => this.toggle());
        this.onEntity("update", (dt) => this.update(dt));
    }


    active = false;
    waterLevel = 50;

    override toData(): ComponentData {
        const data = { active: this.active, waterLevel: this.waterLevel } as Parameters<this["applyData"]>[0];
        return super.toData(data);
    }

    override applyData(data?: { active?: boolean, waterLevel?: number }): void {
        if (data && data.active) this.active = data.active;
        if (data && data.waterLevel) this.waterLevel = data.waterLevel;
    }

    power?: Power;
    tooltip?: EntityTooltip;

    override init() {
        super.init();
        this.entity.getComponent(Interactable)?.setText("Activate");
        this.tooltip = this.entity.getComponent(EntityTooltip);
        if (this.tooltip) this.tooltip.tooltipName = "Sprinkler";
        this.power = this.entity.getComponent(Power);
    }

    update(dt: number): void {
        if (game.weather.weatherData.rainIntensity > 0) {
            this.waterLevel += dt * game.weather.weatherData.rainIntensity * 2;
            this.waterLevel = Math.min(this.waterLevel, 50);
        }

        if (this.active && this.power) {
            if (!this.power.consume(0.25 * dt)) {
                this.active = false;
            }
        }

        this.tooltip?.tooltipData.set("water", `${this.waterLevel.toFixed(1)}/50.0hl`);

    }

    toggle() {
        this.active = !this.active;
    }
}