import { Inventory } from "../components/generic/inventory";
import { Debug } from "../dev/debug";
import { Game, game } from "../game";
import { ItemDefinition, itemDefinitions, ItemGroup } from "../itemDefinitions";
import { Vector } from "../utils/vector";

export class UI {
    static container: HTMLDivElement;
    static mouseOverUI = 0;
    static lastHoveredElement?: UIElement;
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
    }
    static fullscreenMenu: UIFullscreenMenu;
}

export class UIElement {
    public htmlElement: HTMLElement;
    public parent?: UIElement;
    public children: UIElement[];
    constructor(type: string, ...classes: string[]) {
        this.children = [];
        this.htmlElement = document.createElement(type);
        this.htmlElement.classList.add(...classes);
        this.htmlElement.addEventListener("mouseenter", () => {
            UI.mouseOverUI++;
            UI.lastHoveredElement = this;
        });
        this.htmlElement.addEventListener("mouseleave", () => {
            UI.mouseOverUI = UI.mouseOverUI > 0 ? UI.mouseOverUI - 1 : 0;
            if (UI.mouseOverUI == 0)
                UI.lastHoveredElement = undefined;
        });
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
    static create(options: { type: string, classes?: string[], parent: HTMLElement, content?: string }) {
        const element = new UIElement(options.type, ...(options.classes ?? []));
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
    itemHolder: HTMLDivElement;
    constructor() {
        this.element = UI.customDiv(document.body, "fullscreenMenu");
        const bg = UI.customDiv(this.element, "menuBG");
        const border = UI.customDiv(bg, "menuBorder");
        const pattern = UI.customDiv(border, "menuPattern");
        const title = UI.customDiv(this.element, "menuTitle");
        title.innerText = "Revenant Earth 2";

        const inventoryPanel = UI.customDiv(this.element, "inventoryPanel");
        const categoryFilter = UI.customDiv(inventoryPanel, "categoryFilterWrapper");
        const seedFilter = UI.customDiv(categoryFilter);
        seedFilter.classList.add("active");
        seedFilter.innerText = "Seeds";
        seedFilter.addEventListener("click", () => {
            this.selectedGroup = ItemGroup.Seed;
            equipmentFilter.classList.remove("active");
            seedFilter.classList.add("active");
            this.renderItems(game.player.inventory);
        });

        const equipmentFilter = UI.customDiv(categoryFilter);
        equipmentFilter.innerText = "Equipment";
                equipmentFilter.addEventListener("click", () => {
            this.selectedGroup = ItemGroup.Tool;
            seedFilter.classList.remove("active");
            equipmentFilter.classList.add("active");
            this.renderItems(game.player.inventory);
        });
        const itemHeader = UI.customDiv(inventoryPanel, "itemHeader");
        UI.customDiv(itemHeader).innerText = "Icon";
        UI.customDiv(itemHeader).innerText = "Name";
        UI.customDiv(itemHeader).innerText = "Amount";
        this.itemHolder = UI.customDiv(inventoryPanel, "itemHolder");

        
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
        }
    }

    renderItems(inventory?: Inventory) {
        this.itemHolder.innerHTML = "";
        if (!inventory) return;
        for (const [type, amount] of inventory.items) {
            const info = itemDefinitions[type]
            if (info.group != this.selectedGroup) continue;
            this.renderItem(info, amount);
        }
    }

    renderItem(item: ItemDefinition, amount: number) {
        const inventoryItem = UI.customDiv(this.itemHolder, "inventoryItem");
        UI.customElement<HTMLImageElement>("img", inventoryItem, "itemImage").src = item.icon;
        const itemTextWrapper = UI.customDiv(inventoryItem, "itemTextWrapper");
        const itemName = UI.customDiv(itemTextWrapper, "itemName");
        itemName.innerText = item.name;
        const itemDescription = UI.customDiv(itemTextWrapper, "itemDescription");
        itemDescription.innerText = item.description;
        const itemAmount = UI.customDiv(inventoryItem, "itemAmount");
        itemAmount.innerText = amount.toString();
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

export class UIWorldSpaceElement extends UIElement {
    constructor(type: string, position: Vector, ...classes: string[]) {
        super(type, ...classes);
        this.htmlElement.style.position = "absolute";
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
}