import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { Item } from "../../itemDefinitions";

declare module "../types" { interface ComponentRegistry { Inventory: Inventory } }
export default class Inventory extends Component {
    static componentType = "Inventory";
    items = new Map<Item, number>();
    constructor(parent: Entity) {
        super(parent);
    }

    override toData(): ComponentData {
        const items: Record<string, number> = {}
        for (const [item, amount] of this.items) items[item.toString()] = amount;
        return super.toData({ items });
    }

    override applyData(data?: { items?: Record<string, number> }): void {
        for (const [item, amount] of Object.entries(data?.items ?? {})) this.items.set(item as Item, amount);
    }

    add(item: Item, amount: number) {
        if (this.items.has(item)) this.items.set(item, this.items.get(item)! + amount);
        else this.items.set(item, amount);
    }

    getAmount(item: Item) {
        if (this.items.has(item)) return this.items.get(item)!;
        else return 0;
    }

    lootContainer(inventory: Inventory) {
        for (const [item, amount] of inventory.items) this.add(item, amount);
        inventory.items.clear();
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