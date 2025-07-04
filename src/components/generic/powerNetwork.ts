import { Component } from "../../hierarchy/component";
import { ComponentData } from "../componentIndex";
import Power from "./power";

declare module "../types" { interface ComponentRegistry { PowerNetwork: PowerNetwork; } }
export default class PowerNetwork extends Component {
    static componentType = "PowerNetwork";

    power = 0;

    override toData(): ComponentData {
        return super.toData({ power: this.power });
    }

    override applyData(data?: { power: number; }): void {
        if (data && data.power) this.power = data.power;
    }

    capacity = 0;

    consume(amount: number) {
        if (this.power < amount) return false;
        this.power -= amount;
        return true;
    }

    provide(amount: number) {
        this.power += amount;
        this.power = Math.min(this.power, this.capacity);
    }

    connect(power: Power) {
        this.capacity += power.capacity;
    }

    disconnect(power: Power) {
        this.capacity -= power.capacity;
    }
}
