import { EntitySerializer } from "../components/entitySerializer";
import { Transform } from "../components/transfrom";
import { game } from "../game";
import { Component, ComponentData, Constructor } from "./component";
import { Scene } from "./scene";
import { KindedObject } from "./serialise";



type KnownEvents = {
    "update": [number],
    "draw": [number],
    "unload": [],
};

type Callback<T extends keyof KnownEvents> = (...args: KnownEvents[T]) => void


export class Entity {
    id: number;
    components = new Map<number, Component>();
    typeLookup = new Map<Constructor<Component>, Set<Component>>();
    events = new Map<keyof KnownEvents, Set<Function>>();
    componentIndex = 0;
    transform!: Transform;
    scene?: Scene;

    static entityId = 0; //TODO save+load global next entity id

    constructor(id: number) {
        this.id = id;
    }

    on<T extends keyof KnownEvents>(event: T, callback: Callback<T>) {
        if (this.events.has(event) === false) this.events.set(event, new Set());
        this.events.get(event)!.add(callback);
    }

    off<T extends keyof KnownEvents>(event: T, callback: Callback<T>) {
        if (this.events.has(event) === false) return;
        this.events.get(event)!.delete(callback);
    }

    emit<T extends keyof KnownEvents>(event: T, ...args: KnownEvents[T]) {
        if (this.events.has(event) === false) return;
        for (const callback of this.events.get(event)!) {
            callback(...args);
        }
    }

    addComponent(component: Component) {
        this.components.set(this.componentIndex, component);
        if (this.typeLookup.has(component.factory) === false) {
            this.typeLookup.set(component.factory, new Set<Component>());
        }

        this.typeLookup.get(component.factory)!.add(component);
        this.componentIndex++;
    }

    getComponent<T extends Component>(type: Constructor<T>): T | undefined {
        return this.typeLookup.get(type)?.values().next().value as T | undefined;
    }

    getComponents<T extends Component>(type: Constructor<T>): Set<T> {
        const result = this.typeLookup.get(type) ?? new Set<T>();
        return result as Set<T>;
    }

    removeComponent(component: Component) {
        this.typeLookup.get(component.factory)!.delete(component);
        this.components.delete(component.id);
    }

    createComponent(type: Constructor<Component>) {
        const component = new type(this, this.componentIndex);
        this.addComponent(component);
    }


    remove() {
        for (const component of this.components.values()) {
            component.remove();
        }
    }

    static create() {
        const entity = new Entity(this.entityId++);
        entity.createComponent(Transform);
    }

    static fromData(data: EntityData) {
        const entity = new Entity(data.id);

        for (const component of data.component) {
            const comp = Component.fromData(entity, component);
            if (comp) entity.addComponent(comp);
        }


        if (entity.transform == undefined) {
            entity.createComponent(Transform);
        }

        for (const [key, component] of entity.components) {
            component.init();
        }

        return entity;
    }

    static deserialise(deserialise: any, scene?: Scene) {
        game.robo = Entity.fromData(deserialise as EntityData);
        const serialiser = game.robo.getComponent(EntitySerializer); // what
        if (scene && serialiser) scene.register(serialiser); // also what
    }

    toData(): KindedObject {
        const data: EntityData = {
            kind: "Entity",
            id: this.id,
            component: []
        };

        for (const [key, component] of this.components) {
            data.component.push(component.toData());
        }

        return data;
    }
}


type EntityData = {
    kind: "Entity";
    id: number;
    component: Array<ComponentData>;
}