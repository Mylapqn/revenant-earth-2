import { ComponentData } from "../components/componentIndex";
import Transform from "../components/generic/transfrom";
import { game } from "../game";
import { Component, Constructor } from "./component";
import { ISceneObject, Scene } from "./scene";
import { ISerializable, KindedObject, StateMode } from "./serialise";

export type EntityEvents = {
    firstUpdate: [];
    update: [number];
    draw: [number];
    drawShadow: [number];
    unload: [];
    interact: [];
    hoverOn: [];
    hoverOff: [];
    hovered: [];
};

export type Callback<T extends keyof EntityEvents> = (...args: EntityEvents[T]) => void;

export class Entity implements ISerializable, ISceneObject {
    id: number;
    components = new Map<number, Component>();
    typeLookup = new Map<Constructor<Component>, Set<Component>>();
    events = new Map<keyof EntityEvents, Set<Function>>();
    componentIndex = 0;
    transform!: Transform;
    scene?: Scene;
    name: string;
    private _updated = false;

    static entityId = 0; //TODO save+load global next entity id

    constructor(id: number) {
        this.id = id;
        this.name = "Entity " + id;
    }

    on<T extends keyof EntityEvents>(event: T, callback: Callback<T>) {
        if (this.events.has(event) === false) this.events.set(event, new Set());
        this.events.get(event)!.add(callback);
    }

    off<T extends keyof EntityEvents>(event: T, callback: Callback<T>) {
        if (this.events.has(event) === false) return;
        this.events.get(event)!.delete(callback);
    }

    emit<T extends keyof EntityEvents>(event: T, ...args: EntityEvents[T]) {
        if (this.events.has(event) === false) return;
        for (const callback of this.events.get(event)!) {
            callback(...args);
        }
    }

    addComponent(component: Component) {
        this.components.set(this.componentIndex, component);
        component.id = this.componentIndex;
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
        const component = new type(this);
        this.addComponent(component);
    }

    unload() {
        this.emit("unload");
        this.remove();
    }

    update(dt: number) {
        if (this._updated === false) {
            this.firstUpdate();
            this._updated = true;
        }
        this.emit("update", dt);
    }

    firstUpdate() {
        game.events.emit("entityCreate", this);
        this.emit("firstUpdate");
    }

    draw(dt: number) {
        this.emit("draw", dt);
    }

    drawShadow(dt: number) {
        this.emit("drawShadow", dt);
    }

    remove() {
        game.events.emit("entityRemove", this);
        this.scene?.unregister(this);
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
        if (data.name) entity.name = data.name;
        entity.componentIndex = data.component.reduce((max, c) => Math.max(max, c.id ?? -1), -1) + 1;

        for (const component of data.component) {
            const comp = Component.fromData(entity, component);
            if (comp) entity.addComponent(comp);
        }

        if (entity.transform == undefined) {
            entity.createComponent(Transform);
        }

        scene?.register(entity);
        entity.scene = scene;

        for (const [key, component] of entity.components) {
            component.init();
        }
        return entity;
    }

    applyData(data: EntityData) {
        for (const datum of data.component) {
            if (datum.id == undefined) {
                this.addComponent(Component.fromData(this, datum));
                continue;
            }

            if (this.getComponentById(datum.id) == undefined) {
                this.addComponent(Component.fromData(this, datum));
                continue;
            }

            const component = this.getComponentById(datum.id);
            if (component) component.applyData(datum.data);
        }
    }

    static deserialise(deserialise: any, scene?: Scene) {
        const entity = Entity.fromData(deserialise as EntityData, scene);
    }

    serialise(mode: StateMode): KindedObject | false {
        const data = this.toData();
        return data;
    }

    toData(): KindedObject {
        const data: EntityData = {
            kind: "Entity",
            id: this.id,
            name: this.name,
            component: [],
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
    name?: string;
    component: Array<ComponentData>;
};
