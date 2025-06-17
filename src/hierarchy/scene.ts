import { game } from "../game";
import { Component, Constructor } from "./component";
import { Entity } from "./entity";
import { ISerializable, KindedObject, ObjectKind, StateManager, StateMode } from "./serialise";

export interface ISceneObject {
    unload?(): void;
    update?(dt: number): void;
    draw?(dt: number): void;
    drawShadow?(dt: number): void;
}

export class Scene implements ISerializable {
    get objects(): Set<ISerializable & ISceneObject> {
        return this.stateManager.objects;
    }

    get isActive(): boolean {
        return game.activeScene === this;
    }

    stateManager: StateManager;
    name: string = "Scene";
    data: Array<KindedObject> = [];
    hasTerrain: boolean = false;

    constructor() {
        this.stateManager = new StateManager();
        game.stateManager.register(this);
    }

    findEntity(id: number) {
        for (const obj of this.objects) {
            if (obj instanceof Entity) {
                if (obj.id === id) return obj;
            }
        }
    }

    findEntityByName(name: string) {
        for (const obj of this.objects) {
            if (obj instanceof Entity) {
                if (obj.name === name) return obj;
            }
        }
    }

    findComponents<T extends Component>(type: Constructor<T>) {
        const result: T[] = [];
        for (const obj of this.objects) {
            if (obj instanceof Entity) {
                const component = obj.getComponent(type);
                if (component) result.push(component);
            }
        }
        return result;
    }

    findComponent<T extends Component>(type: Constructor<T>, filter?: (component: T) => boolean) {
        for (const obj of this.objects) {
            if (obj instanceof Entity) {
                const component = obj.getComponent(type);
                if (component && (!filter || filter(component))) return component;
            }
        }
    }

    register(obj: ISerializable) {
        this.stateManager.register(obj);
    }

    unregister(obj: ISerializable) {
        this.stateManager.unregister(obj);
    }

    load() {
        if (game.activeScene !== this) game.activeScene.unload();
        game.activeScene = this;
        this.stateManager.deserialise(this.data, this);
        //console.log(this.data.length);
        if (!this.hasTerrain) {
            game.terrainContainer.visible = false;
        }
        else {
            game.terrainContainer.visible = true;
        }
        return this;
    }

    unload() {
        for (const obj of this.objects) {
            obj.unload?.();
        }
    }

    update(dt: number) {
        for (const obj of this.objects) {
            obj.update?.(dt);
        }
    }

    draw(dt: number) {
        for (const obj of this.objects) {
            obj.draw?.(dt);
        }
    }

    drawShadow(dt: number) {
        for (const obj of this.objects) {
            obj.drawShadow?.(dt);
        }
    }

    serialise(mode: StateMode): SceneData {
        if (this.isActive) this.data = this.stateManager.serialise(StateMode.scene);
        return {
            kind: "Scene",
            name: this.name,
            data: this.data,
            //active: mode === StateMode.scene,
            active: this === game.activeScene
        };
    }

    static deserialise(data: SceneData) {
        const scene = new Scene();
        scene.data = data.data as Array<KindedObject>;
        scene.name = data.name;
        game.scenes.set(data.name, scene);
        if (data.active) {
            scene.load();
        }
        return scene;
    }
}

type SceneData = {
    kind: ObjectKind;
    name: string;
    data: Array<KindedObject>;
    active: boolean;
};
