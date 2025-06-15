import { Component } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { Item } from "../../itemDefinitions";





export class Inventory extends Component {
    static componentType = "Inventory";
    items = new Map<Item, number>();
    constructor(parent: Entity) {
        super(parent);
        this.items.set(Item.grass, 10);
        this.items.set(Item.tree, 3);
        this.items.set(Item.vite, 999);
    }

    add(item: Item, amount: number) {
        if (this.items.has(item)) this.items.set(item, this.items.get(item)! + amount);
        else this.items.set(item, amount);
    }

    getAmount(item: Item) {
        if (this.items.has(item)) return this.items.get(item)!;
        else return 0;
    }

    /**
     * Tries to spend an item from the inventory.
     * @param item The item to spend
     * @returns true if the item was spent, false if the item is not in the inventory
     */
    spend(item: Item): boolean {
        if (this.getAmount(item) > 0) {
            this.add(item, -1);
            return true;
        }
        return false;
    }
}