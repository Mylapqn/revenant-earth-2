import { game } from "../../game";
import { Component } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { ParticleText } from "../../hierarchy/particleText";
import { itemDefinitions } from "../../itemDefinitions";
import { Vector } from "../../utils/vector";
import { Interactable } from "../generic/interactable";
import { Inventory } from "../generic/inventory";

export class LootComponent extends Component {
    static componentType = "LootComponent";

    constructor(entity: Entity) {
        super(entity);
        this.onEntity("interact", () => this.loot());
    }

    inventory?: Inventory;
    interactable?: Interactable;
    override init() {
        this.inventory = this.entity.getComponent(Inventory);
        this.interactable = this.entity.getComponent(Interactable);
    }

    loot(): void {
        if (this.inventory && game.player.inventory) {
            let text = "Looted\n";
            for (const [item, amount] of this.inventory.items) text += `${itemDefinitions[item].name} x${amount}\n`;
            new ParticleText(text, this.transform.position.clone().add(new Vector(0, -40),),this.inventory.items.size * 2 + 3);
            game.player.inventory.lootContainer(this.inventory);
            this.interactable?.remove();
        }
    }

}