import { Entity } from "./entity";

export abstract class Component {
    static componentType = "Component";
    id: number;
    parent: Entity;

    get componentType() { return (this.constructor as typeof Component).componentType; }

    constructor(parent: Entity, id: number) {
        this.id = id;
        this.parent = parent;
    }

    applyData(data: any) {}

    remove() {
        this.parent.removeComponent(this.id);
    }
}
