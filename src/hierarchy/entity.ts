import { Transform } from "../components/generic/transfrom";
import { Component, ComponentData, Constructor } from "./component";
import { Scene } from "./scene";
import { ISerializable, KindedObject, StateMode } from "./serialise";



export type KnownEvents = {
    "update": [number],
    "draw": [number],
    "unload": [],
    "interact":[],
};

export type Callback<T extends keyof KnownEvents> = (...args: KnownEvents[T]) => void


export class Entity implements ISerializable {
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

    getComponentById(id: number) {
        return this.components.get(id) as Component | undefined;
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

    unload(){
        this.emit("unload");
        this.remove();
    }

    update(dt: number) {
        this.emit("update", dt);
    }

    draw(dt: number) {
        this.emit("draw", dt);
    }

    remove() {
        for (const component of this.components.values()) {
            component.remove();
        }
    }

    static create() {
        const entity = new Entity(this.entityId++);
        entity.createComponent(Transform);
        return entity;
    }

    static fromData(data: EntityData, scene?: Scene) {
        const entity = new Entity(data.id ?? this.entityId++);
        entity.componentIndex = data.component.reduce((max, c) => Math.max(max, c.id ?? 0), 0);

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
        scene?.register(entity);
        return entity;
    }

    static deserialise(deserialise: any, scene?: Scene) {
        const entity = Entity.fromData(deserialise as EntityData);
        scene?.register(entity);
    }

    serialise(mode: StateMode): KindedObject | false {
        const data = this.toData();
        return data;
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
    id?: number;
    component: Array<ComponentData>;
}