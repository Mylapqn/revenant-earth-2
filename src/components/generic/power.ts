import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";

export class Power extends Component {
    static componentType = "Power";

    capacity = 0;

    override toData(): ComponentData {
        return super.toData({ power: this.capacity });
    }

    override applyData(data?: { power: number }): void {
        if (data) this.capacity = data.power;
    }

    network!: PowerNetwork;

    consume(amount: number) { return this.network.consume(amount); }

    provide(amount: number) { this.network.provide(amount); }

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
        if (data) this.power = data.power;
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