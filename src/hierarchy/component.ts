import { Graphics } from "pixi.js";
import  { UIElement } from "../ui/ui";
import { Callback, Entity, EntityEvents } from "./entity";
import { primitiveObject } from "./serialise";

export type Constructor<T> = { new(parent: Entity): T, componentType: string };

export class Component {
    static componentType = "Component";
    static constructors = new Map<string, Constructor<Component>>();
    id = -1;
    entity: Entity;
    subscribedEvents = new Set<{ type: keyof EntityEvents, callback: Callback<any> }>();

    get componentType() { return (this.constructor as typeof Component).componentType; }
    get factory() { return (this.constructor as Constructor<typeof this>); }

    get transform() {
        return this.entity.transform;
    }

    constructor(entity: Entity) {
        this.entity = entity;
    }

    /** callled once all components on a given entity have been created */
    init() { }

    applyData(data?: primitiveObject) { }

    remove() {
        this.entity.removeComponent(this);
        for (const event of this.subscribedEvents) {
            this.entity.off(event.type, event.callback);
        }
    }

    static register(constructor: Constructor<Component>) {
        this.constructors.set(constructor.componentType, constructor);
    }

    static fromData(entity: Entity, data: ComponentData): Component {
        const constructor = this.constructors.get(data.componentType)
        if (constructor === undefined) throw new Error(`Unknown component type: ${data.componentType}`);
        const component = new constructor(entity);
        component.applyData(data.data);
        return component;
    }

    toData(data?: primitiveObject): ComponentData {
        return { id: this.id, componentType: this.componentType, data };
    }


    onEntity<T extends keyof EntityEvents>(event: T, callback: Callback<T>) {
        this.subscribedEvents.add({ type: event, callback });
        this.entity.on(event, callback);
    }

    debugOptions(buttons: UIElement[],headerAppend?: string): UIElement[] {
        //prepend element to buttons
        if(buttons.length > 0){
            const header = new UIElement("div", "header");
            header.htmlElement.innerText = this.componentType;
            if(headerAppend) header.htmlElement.innerText += ` ${headerAppend}`;
            buttons.unshift(header);
        }
        return buttons;
    }
    debugDraw(graphics: Graphics) {
        
    }
}

export type ComponentData = {
    id?: number;
    componentType: string;
    data?: primitiveObject;
};