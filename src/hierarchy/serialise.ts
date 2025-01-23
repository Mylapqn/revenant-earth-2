import { Player, PlayerData } from "../player";
import { Terrain } from "../terrain";
import { Entity } from "./entity";

export enum StateMode {
    /** identical replication  */
    full,
    /**  */
    scene,
    /** store essential data only */
    base,
}

export type primitive = string | number | boolean;
export type primitiveArray = Array<primitive | primitiveObject>;
export type primitiveObject = { [key: string]: primitive | primitiveObject | primitiveArray };

export type KindedObject = primitiveObject & { kind: string };

export interface ISerializable {
    serialise(mode: StateMode): KindedObject | false;
}

export class StateManager {
    handlers = new Map<string, (data: any) => any>();
    objects = new Set<ISerializable>();

    addHandler(kind: string, handler: (data: any) => any) {
        this.handlers.set(kind, handler);
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

    deserialise(data: Array<KindedObject>) {
        for (const datum of data) {
            this.handlers.get(datum.kind)?.(datum);
        }
    }
}

export function initHandlers(manager: StateManager) {
    manager.addHandler("Player", Player.deserialise);
    manager.addHandler("Terrain", Terrain.deserialise);
    manager.addHandler("Entity", Entity.deserialise);
}

