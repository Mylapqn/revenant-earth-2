import { Entity } from "./entity";
import { primitiveObject } from "./serialise";

export type Constructor<T> = { new(parent: Entity, id: number): T, componentType: string };

export class Component {
    static componentType = "Component";
    static constructors = new Map<string, Constructor<Component>>();
    id: number;
    entity: Entity;

    get componentType() { return (this.constructor as typeof Component).componentType; }
    get factory() { return (this.constructor as Constructor<typeof this>); }

    get transform() {
        return this.entity.transform;
    }

    constructor(entity: Entity, id: number) {
        this.id = id;
        this.entity = entity;
    }

    init() { }

    applyData(data?: primitiveObject) { }

    remove() {
        this.entity.removeComponent(this);
    }

    static register(constructor: Constructor<Component>) {
        this.constructors.set(constructor.componentType, constructor);
    }

    static fromData(entity: Entity, data: ComponentData): Component {
        const constructor = this.constructors.get(data.componentType)
        if (constructor === undefined) throw new Error(`Unknown component type: ${data.componentType}`);
        const component = new constructor(entity, data.id);
        component.applyData(data.data);
        return component;
    }

    toData(data?: primitiveObject): ComponentData {
        return { id: this.id, componentType: this.componentType, data };
    }
}

export type ComponentData = {
    id: number;
    componentType: string;
    data?: primitiveObject;
};