import { Plant } from "../components/custom/plant";
import { Entity } from "./entity";

export type GameEvents = {
    entityCreate: [Entity],
    entityRemove: [Entity],
    playerBuild: [Entity],
    plantGrow: [Plant],
}

export type Callback<T extends keyof GameEvents> = (...args: GameEvents[T]) => void;

export class GameEventSystem {
    events = new Map<keyof GameEvents, Set<Function>>();
    on<T extends keyof GameEvents>(event: T, callback: Callback<T>) {
        if (this.events.has(event) === false) this.events.set(event, new Set());
        this.events.get(event)!.add(callback);
    }

    off<T extends keyof GameEvents>(event: T, callback: Callback<T>) {
        if (this.events.has(event) === false) return;
        this.events.get(event)!.delete(callback);
    }

    emit<T extends keyof GameEvents>(event: T, ...args: GameEvents[T]) {
        if (this.events.has(event) === false) return;
        for (const callback of this.events.get(event)!) {
            callback(...args);
        }
    }
}