import { Callback, Entity, KnownEvents } from "./entity";
import { primitiveObject } from "./serialise";

export type Constructor<T> = { new(parent: Entity): T, componentType: string };

export class Component {
    static componentType = "Component";
    static constructors = new Map<string, Constructor<Component>>();
    id = -1;
    entity: Entity;
    subscribedEvents = new Set<{ type: keyof KnownEvents, callback: Callback<any> }>();

    get componentType() { return (this.constructor as typeof Component).componentType; }
    get factory() { return (this.constructor as Constructor<typeof this>); }

    get transform() {
        return this.entity.transform;
    }

    constructor(entity: Entity) {
        this.entity = entity;
    }

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


    onEntity<T extends keyof KnownEvents>(event: T, callback: Callback<T>) {
        this.subscribedEvents.add({ type: event, callback });
        this.entity.on(event, callback);
    }
}

export type ComponentData = {
    id?: number;
    componentType: string;
    data?: primitiveObject;
};