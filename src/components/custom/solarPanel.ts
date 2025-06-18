import { game } from "../../game";
import { Component } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { EntityTooltip } from "../generic/entityTooltip";
import { Power } from "../generic/power";

export class SolarPanel extends Component {
    static componentType = "SolarPanel";

    constructor(entity: Entity) {
        super(entity);
        this.onEntity("update", (dt) => this.update(dt));
    }

    power!: Power;
    tooltip?: EntityTooltip;
    init(): void {
        this.power = this.entity.getComponent(Power)!;
        this.tooltip = this.entity.getComponent(EntityTooltip);
    }

    update(dt: number): void {
        const flux = Math.max(game.weather.dayRatio - 0.5, 0) * 2 * 1000 * Math.max(1 - (game.weather.weatherData.rainBuildup / 30), 0);
        const area = 1.6 * 3;
        const watts = flux * dt * 0.2 * area;
        this.power?.provide(watts / 1000);

        if(this.tooltip){
            this.tooltip.tooltipData.set("flux", `${watts.toFixed(1)}W`);
        }
    }
}