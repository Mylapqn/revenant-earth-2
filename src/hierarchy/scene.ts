import { game } from "../game";
import { Entity } from "./entity";
import { ISerializable, KindedObject, ObjectKind, StateManager, StateMode } from "./serialise";

export interface ISceneObject {
    unload?(): void;
    update?(dt: number): void;
    draw?(dt: number): void;
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

    constructor() {
        this.stateManager = new StateManager();
        game.stateManager.register(this);
    }

    register(obj: ISerializable) {
        this.stateManager.register(obj);
    }

    unregister(obj: ISerializable) {
        this.stateManager.unregister(obj);
    }

    load() {
        this.stateManager.deserialise(this.data, this);
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

    serialise(mode: StateMode): SceneData | false {
        this.data = this.stateManager.serialise(StateMode.scene);
        return {
            kind: "Scene",
            name: this.name,
            data: this.data,
            active: mode === StateMode.scene,
        };
    }

    static deserialise(data: SceneData) {
        const scene = new Scene();
        scene.data = data.data as Array<KindedObject>;
        scene.name = data.name;
        game.scenes.set(data.name, scene);
        if (data.active) {
            game.activeScene = scene;
            scene.load();
        }
    }
}

type SceneData = {
    kind: ObjectKind;
    name: string;
    data: Array<KindedObject>;
    active: boolean;
};
