import { Atmo } from "../atmo";
import { Player, PlayerData } from "../player";
import { Terrain } from "../terrain";
import { Entity } from "./entity";
import { ProgressDatabase } from "./progressDatabase";
import { Scene } from "./scene";

export enum StateMode {
    scene,
    full,
}


export type ObjectKind = "Player" | "Terrain" | "Atmo" | "Entity" | "Scene" | "ProgressDB";

export type primitive = string | number | boolean;
export type primitiveArray = Array<primitive | primitiveObject>;
export type primitiveObject = { [key: string]: primitive | primitiveObject | primitiveArray };

export type KindedObject = primitiveObject & { kind: ObjectKind };

export interface ISerializable {
    serialise(mode: StateMode): KindedObject | false;
}

export class StateManager {
    static handlers = new Map<ObjectKind, (data: any, scene?: Scene) => any>();
    objects = new Set<ISerializable>();

    static addHandler(kind: ObjectKind, handler: (data: any) => any) {
        StateManager.handlers.set(kind, handler);
    }

    register(obj: ISerializable) {
        this.objects.add(obj);
    }

    unregister(obj: ISerializable) {
        this.objects.delete(obj);
    }

    serialise(mode: StateMode) {
        const objects = [];
        for (const object of this.objects) {
            const serialised = object.serialise(mode);
            if (serialised) {
                objects.push(serialised);
            }
        }

        return objects;
    }

    deserialise(data: Array<KindedObject>, scene?: Scene) {
        for (const datum of data) {
            StateManager.handlers.get(datum.kind)?.(datum, scene);
        }
    }
}

export function initHandlers() {
    StateManager.addHandler("Player", Player.deserialise);
    StateManager.addHandler("Terrain", Terrain.deserialise);
    StateManager.addHandler("Atmo", Atmo.deserialise);
    StateManager.addHandler("Entity", Entity.deserialise);
    StateManager.addHandler("Scene", Scene.deserialise);
    StateManager.addHandler("ProgressDB", ProgressDatabase.deserialise);
}
