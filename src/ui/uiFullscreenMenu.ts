import { CSSClassAnimation } from "../animations/CSSClassAnimation";
import type { Inventory } from "../components/generic/inventory";
import { game } from "../game";
import { ItemGroup, itemDefinitions, ItemDefinition } from "../itemDefinitions";
import { UI } from "./ui";
import { UIElement } from "./uiElement";


export class UIFullscreenMenu {
    parentElement: UIElement<HTMLDivElement>;
    htmlElement: HTMLDivElement;
    visible = false;
    itemHolder: UIElement;
    badgeContainer: UIElement;
    constructor() {
        this.parentElement = new UIElement<HTMLDivElement>({ type: "div", classes: ["fullscreenMenu"], parent: document.body, blockMouse: true });
        this.htmlElement = this.parentElement.htmlElement;
        const bg = new UIElement({ type: "div", classes: ["menuBG"], parent: this.htmlElement });
        const border = new UIElement({ type: "div", classes: ["menuBorder"], parent: bg.htmlElement });
        const pattern = new UIElement({ type: "div", classes: ["menuPattern"], parent: border.htmlElement });
        const title = new UIElement({ type: "div", classes: ["menuTitle"], content: "Inventory", parent: this.htmlElement });
        const contentHolder = new UIElement({ type: "div", classes: ["contentHolder"], parent: this.htmlElement });

        const inventoryPanel = new UIElement({ type: "div", classes: ["inventoryPanel"], parent: contentHolder.htmlElement });
        const categoryFilter = new UIElement({ type: "div", classes: ["categoryFilterWrapper"], parent: inventoryPanel.htmlElement });
        const seedFilter = new UIElement({ type: "div", parent: categoryFilter.htmlElement });
        seedFilter.htmlElement.classList.add("active");
        seedFilter.htmlElement.innerText = "Seeds";
        seedFilter.htmlElement.addEventListener("click", () => {
            this.selectedGroup = ItemGroup.Seed;
            equipmentFilter.htmlElement.classList.remove("active");
            seedFilter.htmlElement.classList.add("active");
            this.renderItems(game.player.inventory);
        });

        const equipmentFilter = new UIElement({ type: "div", parent: categoryFilter.htmlElement });
        equipmentFilter.htmlElement.innerText = "Equipment";
        equipmentFilter.htmlElement.addEventListener("click", () => {
            this.selectedGroup = ItemGroup.Building;
            seedFilter.htmlElement.classList.remove("active");
            equipmentFilter.htmlElement.classList.add("active");
            this.renderItems(game.player.inventory);
        });
        const itemHeader = new UIElement({ type: "div", classes: ["itemHeader"], parent: inventoryPanel.htmlElement });
        new UIElement({ type: "div", parent: itemHeader.htmlElement }).htmlElement.innerText = "Icon";
        new UIElement({ type: "div", parent: itemHeader.htmlElement }).htmlElement.innerText = "Name";
        new UIElement({ type: "div", parent: itemHeader.htmlElement }).htmlElement.innerText = "Amount";
        this.itemHolder = new UIElement({ type: "div", classes: ["itemHolder"], parent: inventoryPanel.htmlElement });

        const progressPanel = new UIElement({ type: "div", classes: ["progressPanel"], parent: contentHolder.htmlElement });
        this.badgeContainer = new UIElement({ type: "div", classes: ["badgeContainer"], parent: progressPanel.htmlElement });
    }

    selectedGroup = ItemGroup.Seed;

    toggle(show: boolean = !this.visible) {
        if (show) {
            game.animator.play(this, CSSClassAnimation.showAnimation(this.htmlElement, 300));
            //this.htmlElement.classList.add("menuAppear");
            //this.htmlElement.classList.remove("menuHide");
            this.visible = true;
            this.renderItems(game.player.inventory);
            this.renderProgress();
        }
        else {
            game.animator.play(this, CSSClassAnimation.hideAnimation(this.htmlElement, 300));
            //this.htmlElement.classList.add("menuHide");
            //this.htmlElement.classList.remove("menuAppear");
            this.visible = false;
            UI.mouseOffElement(this.parentElement);
        }
    }

    async renderProgress() {
        const { temp, co2, averageAirPollution, averageGroundPollution } = await game.getGraphs();
        this.badgeContainer.htmlElement.innerHTML = "";
        this.progressBadge("Temperature", temp);
        this.progressBadge("CO2", co2);
        this.progressBadge("Average Air Pollution", averageAirPollution);
        this.progressBadge("Average Ground Pollution", averageGroundPollution);
    }

    private progressBadge(name: string, { value, trend, img }: { value: string; trend: number; img: HTMLImageElement; }) {
        const badge = new UIElement({ type: "div", classes: ["progressBadge"], parent: this.badgeContainer.htmlElement });
        const leftContainer = new UIElement({ type: "div", classes: ["leftContainer"], parent: badge.htmlElement });
        const rightContainer = new UIElement({ type: "div", classes: ["rightContainer"], parent: badge.htmlElement });
        const badgeName = new UIElement({ type: "div", classes: ["badgeName"], parent: leftContainer.htmlElement });
        badgeName.htmlElement.innerText = name;
        const leftBottom = new UIElement({ type: "div", classes: ["leftBottom"], parent: leftContainer.htmlElement });
        const trendDirection = trend > 0 ? "up" : trend < 0 ? "down" : "flat";
        const trendValue = new UIElement({ type: "div", classes: ["trendValue", trendDirection], parent: leftBottom.htmlElement });
        const badgeValue = new UIElement({ type: "div", classes: ["badgeValue"], parent: leftBottom.htmlElement });
        badgeValue.htmlElement.innerText = value;
        rightContainer.htmlElement.appendChild(img);
    }

    renderItems(inventory?: Inventory) {
        this.itemHolder.htmlElement.innerHTML = "";
        if (!inventory) return;
        for (const [type, amount] of inventory.items) {
            const info = itemDefinitions[type];
            if (info.group != this.selectedGroup) continue;
            this.renderItem(info, amount);
        }
    }

    renderItem(item: ItemDefinition, amount: number) {
        const inventoryItem = new UIElement({ type: "div", classes: ["inventoryItem"], parent: this.itemHolder.htmlElement, mouseSoundEffects: true });
        new UIElement<HTMLImageElement>({ type: "img", classes: ["itemImage"], parent: inventoryItem.htmlElement }).htmlElement.src = item.icon;
        const itemTextWrapper = new UIElement({ type: "div", classes: ["itemTextWrapper"], parent: inventoryItem.htmlElement });
        const itemName = new UIElement({ type: "div", classes: ["itemName"], parent: itemTextWrapper.htmlElement });
        itemName.htmlElement.innerText = item.name;
        const itemDescription = new UIElement({ type: "div", classes: ["itemDescription"], parent: itemTextWrapper.htmlElement });
        itemDescription.htmlElement.innerText = item.description;
        const itemAmount = new UIElement({ type: "div", classes: ["itemAmount"], parent: inventoryItem.htmlElement });
        itemAmount.htmlElement.innerText = amount.toString();

        inventoryItem.htmlElement.addEventListener("click", () => {
            game.player.buildable(item.name);
        });
    }
}
