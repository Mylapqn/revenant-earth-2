import { game } from "../../game";
import { Component } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { Power } from "../generic/power";

export class SolarPanel extends Component {
    static componentType = "SolarPanel";

    constructor(entity: Entity) {
        super(entity);
        this.onEntity("update", (dt) => this.update(dt));
    }

    power!: Power;
    init(): void {
        this.power = this.entity.getComponent(Power)!;
    }

    update(dt: number): void {
        const flux = Math.max(game.weather.dayRatio - 0.5, 0) * 2 * 1000 * (1 - (game.weather.weatherData.rainBuildup / 30));
        const area = 1.6 * 3;
        const watts = flux * dt * 0.2 * area;
        this.power?.provide(watts / 1000);
    }
}