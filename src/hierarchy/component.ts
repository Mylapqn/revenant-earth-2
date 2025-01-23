import { Entity } from "./entity";
import { primitiveObject } from "./serialise";

export type Constructor<T> = { new(parent: Entity, id: number): T, componentType: string };

export class Component {
    static componentType = "Component";
    static constructors = new Map<string, Constructor<Component>>();
    id: number;
    parent: Entity;

    get componentType() { return (this.constructor as typeof Component).componentType; }
    get factory() { return (this.constructor as Constructor<typeof this>); }

    constructor(parent: Entity, id: number) {
        this.id = id;
        this.parent = parent;
    }

    init() { }

    applyData(data?: primitiveObject) { }

    remove() {
        this.parent.removeComponent(this);
    }

    static register(constructor: Constructor<Component>) {
        this.constructors.set(constructor.componentType, constructor);
    }

    static fromData(parent: Entity, data: ComponentData): Component {
        const constructor = this.constructors.get(data.componentType)
        if (constructor === undefined) throw new Error(`Unknown component type: ${data.componentType}`);
        const component = new constructor(parent, data.id);
        component.applyData(data.data);
        return component;
    }

    toData(): ComponentData {
        return { id: this.id, componentType: this.componentType };
    }
}

export type ComponentData = {
    id: number;
    componentType: string;
    data?: primitiveObject;
};