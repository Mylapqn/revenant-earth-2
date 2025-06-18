import { game } from "../../game";
import { Component } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
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
            game.player.inventory.lootContainer(this.inventory);
            this.interactable?.remove();
        }
    }

}