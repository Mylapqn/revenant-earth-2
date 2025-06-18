import type { Inventory } from "../components/generic/inventory";
import { Game, game } from "../game";
import { ItemDefinition, itemDefinitions, ItemGroup } from "../itemDefinitions";
import { Vector } from "../utils/vector";

export class UI {
    static container: HTMLDivElement;
    static mouseOverUI = 0;
    static lastHoveredElement?: UIElement;
    static quickInventory?: UIQuickInventory;
    static customElement<T = HTMLElement>(type: string, parent: HTMLElement, ...classes: string[]): T {
        const element = document.createElement(type);
        element.classList.add(...classes);
        parent.appendChild(element);
        return element as T;
    }
    static customDiv(parent: HTMLElement, ...classes: string[]) {
        return UI.customElement("div", parent, ...classes) as HTMLDivElement;
    }
    static update() {
        if (game.input.mouse.movedThisFrame()) {
            if (UIContextMenu.current) {
                if (UIContextMenu.currentLocation.distance(game.input.mouse.position) > 50 && UIContextMenu.current.mouseLeft) {
                    UIContextMenu.current.remove();
                }
            }
        }
    }
    static init() {
        UI.container = UI.customDiv(document.body, "uiContainer");
        UI.fullscreenMenu = new UIFullscreenMenu();
        //setTimeout(() => UI.fullscreenMenu.toggle(true), 100);
        UI.mouseOverUI = 0;
        UI.quickInventory = new UIQuickInventory();
    }
    static destroy() {
        UI.container.remove();
        UI.fullscreenMenu.element.remove();
    }
    static fullscreenMenu: UIFullscreenMenu;
}

export class UIElement<T extends HTMLElement = HTMLElement> {
    public htmlElement: T;
    public parent?: UIElement;
    public children: UIElement[];
    hoverSFX = false;
    clickSFX = false;
    blockMouse = true;
    onclick?: () => void;
    constructor(type: string, ...classes: string[]) {
        this.children = [];
        this.htmlElement = document.createElement(type) as T;
        this.htmlElement.classList.add(...classes);
        this.htmlElement.addEventListener("mouseenter", () => {
            if (this.hoverSFX) game.soundManager.play("hover");
            if (this.blockMouse) {
                UI.mouseOverUI++;
                UI.lastHoveredElement = this;
            }
        });
        this.htmlElement.addEventListener("mouseleave", () => {
            if (this.blockMouse) {
                UI.mouseOverUI = UI.mouseOverUI > 0 ? UI.mouseOverUI - 1 : 0;
                if (UI.mouseOverUI == 0)
                    UI.lastHoveredElement = undefined;
            }
        });
        this.htmlElement.addEventListener("click", () => {
            if (this.clickSFX) game.soundManager.play("click");
            if (this.onclick)
                this.onclick();
        })
    }
    remove() {
        while (this.children.length > 0) {
            this.children[0].remove();
        }
        if (this == UI.lastHoveredElement) {
            UI.lastHoveredElement = this.parent;
            UI.mouseOverUI--;
        }
        if (this.parent) {
            this.parent.children.splice(this.parent.children.indexOf(this), 1);
        }
        this.htmlElement.remove();
    }
    addChild(...uielement: UIElement[]) {
        for (const element of uielement) {
            this.htmlElement.appendChild(element.htmlElement);
            element.parent = this;
            this.children.push(element);
        }
    }

    static create<T extends HTMLElement>(options: { type: string, classes?: string[], parent: HTMLElement, content?: string, soundEffects?: boolean, blockMouse?: boolean }): UIElement<T> {
        const element = new UIElement<T>(options.type, ...(options.classes ?? []));
        element.hoverSFX = options.soundEffects ?? false;
        element.clickSFX = options.soundEffects ?? false;
        element.blockMouse = options.blockMouse ?? true;
        options.parent.appendChild(element.htmlElement);
        if (options.content) element.htmlElement.innerHTML = options.content;
        return element;
    }
}

export class UIPanel extends UIElement {

    constructor() {
        super("div");
    }
}
export class UIFullscreenMenu {
    element: HTMLDivElement;
    shown = false;
    itemHolder: UIElement;
    constructor() {
        this.element = UI.customDiv(document.body, "fullscreenMenu");
        const bg = UIElement.create({ type: "div", classes: ["menuBG"], parent: this.element });
        const border = UIElement.create({ type: "div", classes: ["menuBorder"], parent: bg.htmlElement });
        const pattern = UIElement.create({ type: "div", classes: ["menuPattern"], parent: border.htmlElement });
        const title = UIElement.create({ type: "div", classes: ["menuTitle"], content: "Revenant Earth 2", parent: this.element });

        const inventoryPanel = UIElement.create({ type: "div", classes: ["inventoryPanel"], parent: this.element });
        const categoryFilter = UIElement.create({ type: "div", classes: ["categoryFilterWrapper"], parent: inventoryPanel.htmlElement });
        const seedFilter = UIElement.create({ type: "div", parent: categoryFilter.htmlElement });
        seedFilter.htmlElement.classList.add("active");
        seedFilter.htmlElement.innerText = "Seeds";
        seedFilter.htmlElement.addEventListener("click", () => {
            this.selectedGroup = ItemGroup.Seed;
            equipmentFilter.htmlElement.classList.remove("active");
            seedFilter.htmlElement.classList.add("active");
            this.renderItems(game.player.inventory);
        });

        const equipmentFilter = UIElement.create({ type: "div", parent: categoryFilter.htmlElement });
        equipmentFilter.htmlElement.innerText = "Equipment";
        equipmentFilter.htmlElement.addEventListener("click", () => {
            this.selectedGroup = ItemGroup.Tool;
            seedFilter.htmlElement.classList.remove("active");
            equipmentFilter.htmlElement.classList.add("active");
            this.renderItems(game.player.inventory);
        });
        const itemHeader = UIElement.create({ type: "div", classes: ["itemHeader"], parent: inventoryPanel.htmlElement });
        UIElement.create({ type: "div", parent: itemHeader.htmlElement }).htmlElement.innerText = "Icon";
        UIElement.create({ type: "div", parent: itemHeader.htmlElement }).htmlElement.innerText = "Name";
        UIElement.create({ type: "div", parent: itemHeader.htmlElement }).htmlElement.innerText = "Amount";
        this.itemHolder = UIElement.create({ type: "div", classes: ["itemHolder"], parent: inventoryPanel.htmlElement });


    }

    selectedGroup = ItemGroup.Seed;

    toggle(show?: boolean) {
        if (show === undefined) show = !this.shown;
        if (show) {
            this.element.classList.add("menuAppear");
            this.element.classList.remove("menuHide");
            this.shown = true;
            this.renderItems(game.player.inventory);
        }
        else {
            this.element.classList.add("menuHide");
            this.element.classList.remove("menuAppear");
            this.shown = false;
            UI.mouseOverUI = 0;
        }
    }

    renderItems(inventory?: Inventory) {
        this.itemHolder.htmlElement.innerHTML = "";
        if (!inventory) return;
        for (const [type, amount] of inventory.items) {
            const info = itemDefinitions[type]
            if (info.group != this.selectedGroup) continue;
            this.renderItem(info, amount);
        }
    }

    renderItem(item: ItemDefinition, amount: number) {
        const inventoryItem = UIElement.create({ type: "div", classes: ["inventoryItem"], parent: this.itemHolder.htmlElement, soundEffects: true });
        UIElement.create<HTMLImageElement>({ type: "img", classes: ["itemImage"], parent: inventoryItem.htmlElement }).htmlElement.src = item.icon;
        const itemTextWrapper = UIElement.create({ type: "div", classes: ["itemTextWrapper"], parent: inventoryItem.htmlElement });
        const itemName = UIElement.create({ type: "div", classes: ["itemName"], parent: itemTextWrapper.htmlElement });
        itemName.htmlElement.innerText = item.name;
        const itemDescription = UIElement.create({ type: "div", classes: ["itemDescription"], parent: itemTextWrapper.htmlElement });
        itemDescription.htmlElement.innerText = item.description;
        const itemAmount = UIElement.create({ type: "div", classes: ["itemAmount"], parent: inventoryItem.htmlElement });
        itemAmount.htmlElement.innerText = amount.toString();

        inventoryItem.htmlElement.addEventListener("click", () => {
            game.player.buildable(item.name);
        })
    }
}

export class UIContextMenu extends UIPanel {
    static current?: UIContextMenu;
    static currentLocation: Vector = new Vector();
    public mouseLeft = true;
    constructor(...uiElement: UIElement[]) {
        super();

        if (UIContextMenu.current) {
            UIContextMenu.current.remove();
        }
        UIContextMenu.current = this;

        UI.container.appendChild(this.htmlElement);
        this.htmlElement.classList.add("drop-menu", "basic");
        this.htmlElement.style.position = "absolute";
        this.htmlElement.style.top = game.input.mouse.position.y + "px";
        this.htmlElement.style.left = game.input.mouse.position.x + "px";
        UIContextMenu.currentLocation = game.input.mouse.position.clone();
        this.htmlElement.style.zIndex = "10";

        this.htmlElement.addEventListener("mouseleave", () => {
            this.mouseLeft = true;
        });
        this.htmlElement.addEventListener("mouseenter", () => {
            this.mouseLeft = false;
        });

        this.htmlElement.addEventListener("click", () => {
            this.remove();
        });

        if (uiElement.length > 0) {
            this.addChild(...uiElement);
        }

    }
    remove() {
        UIContextMenu.current = undefined;
        super.remove();
    }
}
export class UIQuickInventory extends UIPanel {
    element: UIElement;
    visible = false;
    constructor() {
        super();
        this.element = UIElement.create({ type: "div", classes: ["quickInventory"], parent: document.body });
        this.element.htmlElement.style.display = "none";
    }

    toggle() {
        if (this.visible) {
            this.hide();
        }
        else {
            this.element.htmlElement.style.display = "";
            this.renderItems(game.player.inventory!);
            this.visible = true;
        }
    }

    hide() {
        this.element.htmlElement.style.display = "none";
        this.visible = false;
        UI.mouseOverUI = 0;
    }

    currentGroup = ItemGroup.Seed;

    renderItems(inventory: Inventory) {
        this.element.htmlElement.innerHTML = "";

        {
            const inventoryItem = UIElement.create({ type: "div", classes: ["quickInventoryItem"], parent: this.element.htmlElement, soundEffects: true });
            //UIElement.create<HTMLImageElement>({ type: "img", classes: ["quickInventoryItemImage"], parent: inventoryItem.htmlElement }).htmlElement.src

            const itemName = UIElement.create({ type: "div", classes: ["quickInventoryItemName"], parent: inventoryItem.htmlElement });
            itemName.htmlElement.innerText = "Swap to " + (this.currentGroup == ItemGroup.Seed ? "Tools" : "Seeds");

            inventoryItem.htmlElement.addEventListener("click", () => {
                this.currentGroup = this.currentGroup == ItemGroup.Seed ? ItemGroup.Tool : ItemGroup.Seed;
                this.renderItems(game.player.inventory!);
            })
        }

        for (const [item, amount] of inventory.items) {
            const info = itemDefinitions[item];
            if (info.group != this.currentGroup) continue;
            const inventoryItem = UIElement.create({ type: "div", classes: ["quickInventoryItem"], parent: this.element.htmlElement, soundEffects: true });
            UIElement.create<HTMLImageElement>({ type: "img", classes: ["quickInventoryItemImage"], parent: inventoryItem.htmlElement }).htmlElement.src = info.icon;
            const itemAmount = UIElement.create({ type: "div", classes: ["quickInventoryItemAmount"], parent: inventoryItem.htmlElement });
            itemAmount.htmlElement.innerText = amount.toString();
            const itemName = UIElement.create({ type: "div", classes: ["quickInventoryItemName"], parent: inventoryItem.htmlElement });
            itemName.htmlElement.innerText = info.name;

            inventoryItem.htmlElement.addEventListener("click", () => {
                game.player.buildable(info.name);
                this.hide();

            })
        }

        {
            const inventoryItem = UIElement.create({ type: "div", classes: ["quickInventoryItem"], parent: this.element.htmlElement, soundEffects: true });
            //UIElement.create<HTMLImageElement>({ type: "img", classes: ["quickInventoryItemImage"], parent: inventoryItem.htmlElement }).htmlElement.src

            const itemName = UIElement.create({ type: "div", classes: ["quickInventoryItemName"], parent: inventoryItem.htmlElement });
            itemName.htmlElement.innerText = "Close"

            inventoryItem.htmlElement.addEventListener("click", () => {
                this.hide();
            })
        }

    }
}

export class UIAbsoluteElement extends UIElement {
    constructor(type: string, worldPosition: Vector, ...classes: string[]) {
        super(type, ...classes);
        this.htmlElement.style.position = "absolute";
        this.setWorldPosition(worldPosition);
    }
    setWorldPosition(position: Vector) {
        if (game.camera.inViewX(position.x, 200)) {
            const screenPos = game.camera.worldToScreen(position);
            this.htmlElement.style.display = "";
            this.htmlElement.style.left = screenPos.x + "px";
            this.htmlElement.style.top = screenPos.y + "px";
        }
        else {
            this.htmlElement.style.display = "none";
        }
    }
    setRenderPosition(position: Vector) {
        this.htmlElement.style.left = position.x * 100 + "%";
        this.htmlElement.style.top = position.y * 100 + "%";
    }
    setScreenPosition(position: Vector) {
        this.htmlElement.style.left = position.x + "px";
        this.htmlElement.style.top = position.y + "px";
    }
}

