import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { EntityTooltip } from "./entityTooltip";

export class Power extends Component {
    static componentType = "Power";

    constructor(entity: Entity) {
        super(entity);
        this.onEntity("hovered", () => this.powerInfo());
    }

    capacity = 0;

    override toData(): ComponentData {
        return super.toData({ capacity: this.capacity });
    }

    override applyData(data?: { capacity: number }): void {
        if (data && data.capacity) this.capacity = data.capacity;
    }

    network!: PowerNetwork;

    consume(amount: number) { return this.network.consume(amount); }

    provide(amount: number) { this.network.provide(amount); }

    tooltip?: EntityTooltip;

    powerInfo() {
        if (!this.tooltip) return;
        this.tooltip.tooltipData.set("power", (this.network.power).toFixed(1) + "/" + (this.network.capacity).toFixed(1) + "kWh");
    }

    init(): void {
        if (this.entity.scene) {
            let network = this.entity.scene.findComponent(PowerNetwork);
            if (!network) {
                const e = Entity.fromData({
                    kind: "Entity",
                    name: "Power Network",
                    component: [{ componentType: "PowerNetwork" }]
                }, this.entity.scene);
                network = e.getComponent(PowerNetwork)!;
            }

            this.network = network;

            network.connect(this);
        } else console.error("No scene");
        this.tooltip = this.entity.getComponent(EntityTooltip);
    }

    override remove(): void {
        this.network?.disconnect(this);
        super.remove();
    }
}


export class PowerNetwork extends Component {
    static componentType = "PowerNetwork";

    power = 0;

    override toData(): ComponentData {
        return super.toData({ power: this.power });
    }

    override applyData(data?: { power: number }): void {
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