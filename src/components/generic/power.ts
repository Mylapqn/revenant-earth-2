import { Component } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { ComponentData } from "../componentIndex";
import EntityTooltip from "./entityTooltip";
import PowerNetwork from "./powerNetwork";

declare module "../types" { interface ComponentRegistry { Power: Power } }
export default class Power extends Component {
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

