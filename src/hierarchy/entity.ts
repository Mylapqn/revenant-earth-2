import { Component } from "./component";

export class Entity {
    id: number;
    components = new Map<number, Component>();
    componentIndex = 0;

    constructor(id: number) {
        this.id = id;
    }

    addComponent(component: Component) {
        this.components.set(this.componentIndex, component);
        this.componentIndex++;
    }

    removeComponent(component: Component | number) {
        if (typeof component != "number") component = component.id;
        this.components.delete(component);
    }

    
} 