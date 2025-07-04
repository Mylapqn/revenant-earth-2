import type Inventory from "../components/generic/inventory";
import { game } from "../game";
import { ItemGroup, itemDefinitions } from "../itemDefinitions";
import { UI } from "./ui";
import { UIElement } from "./uiElement";


export class UIQuickInventory {
    element: UIElement;
    visible = false;
    constructor() {
        this.element = new UIElement({ type: "div", classes: ["quickInventory"], parent: document.body, blockMouse: true });
        this.element.htmlElement.style.display = "none";
        this.element.htmlElement.addEventListener("mouseleave", () => this.hide());
        this.element.htmlElement.addEventListener("mouseup", (e: MouseEvent) => {
            if (e.button == 1 || e.button == 2) this.hide();
        });
    }

    toggle() {
        if (this.visible) {
            this.hide();
        }
        else {
            this.show();
        }
    }

    show() {
        this.element.htmlElement.style.left = game.input.mouse.position.x + "px";
        this.element.htmlElement.style.top = game.input.mouse.position.y + "px";
        this.element.htmlElement.style.display = "";
        this.renderItems(game.player.inventory!);
        this.visible = true;
    }

    hide() {
        this.element.htmlElement.style.display = "none";
        UI.mouseOffElement(this.element);
        this.visible = false;
    }

    currentGroup = ItemGroup.Seed;

    renderItems(inventory: Inventory) {
        this.element.htmlElement.innerHTML = "";

        {
            const inventoryItem = new UIElement({ type: "div", classes: ["quickInventoryItem"], parent: this.element.htmlElement, mouseSoundEffects: true });
            //new UIElement<HTMLImageElement>({ type: "img", classes: ["quickInventoryItemImage"], parent: inventoryItem.htmlElement }).htmlElement.src
            const itemName = new UIElement({ type: "div", classes: ["quickInventoryItemName"], parent: inventoryItem.htmlElement });
            itemName.htmlElement.innerText = "Swap to " + (this.currentGroup == ItemGroup.Seed ? "Buildings" : "Seeds");

            inventoryItem.htmlElement.addEventListener("click", () => {
                this.currentGroup = this.currentGroup == ItemGroup.Seed ? ItemGroup.Building : ItemGroup.Seed;
                this.renderItems(game.player.inventory!);
            });
        }

        for (const [item, amount] of inventory.items) {
            const info = itemDefinitions[item];
            if (info.group != this.currentGroup) continue;
            const inventoryItem = new UIElement({ type: "div", classes: ["quickInventoryItem"], parent: this.element.htmlElement, mouseSoundEffects: true });
            new UIElement<HTMLImageElement>({ type: "img", classes: ["quickInventoryItemImage"], parent: inventoryItem.htmlElement }).htmlElement.src = info.icon;
            const itemName = new UIElement({ type: "div", classes: ["quickInventoryItemName"], parent: inventoryItem.htmlElement, content: info.name });
            const amountText = amount > 0 ? amount.toString() : `Order (${info.cost.toString()} TP)`;
            const itemAmount = new UIElement({ type: "div", classes: ["quickInventoryItemAmount"], parent: inventoryItem.htmlElement, content: amountText });
            if (amount <= 0) itemAmount.htmlElement.classList.add(game.score.score >= info.cost ? "payGood" : "payBad");

            inventoryItem.htmlElement.addEventListener("click", () => {
                if (amount > 0) {
                    game.player.buildable(info.name);
                    this.hide();
                }
                else if (game.score.pay(info.cost)) {
                    game.player.inventory!.add(item, 1);
                    game.player.buildable(info.name);
                    this.hide();
                }
            }
            );
        }

        /*{
            const inventoryItem = new UIElement({ type: "div", classes: ["quickInventoryItem"], parent: this.element.htmlElement, mouseSoundEffects: true });
            //new UIElement<HTMLImageElement>({ type: "img", classes: ["quickInventoryItemImage"], parent: inventoryItem.htmlElement }).htmlElement.src
            const itemName = new UIElement({ type: "div", classes: ["quickInventoryItemName"], parent: inventoryItem.htmlElement });
            itemName.htmlElement.innerText = "Close";

            inventoryItem.htmlElement.addEventListener("click", () => {
                this.hide();
            });
        }*/

    }
}
