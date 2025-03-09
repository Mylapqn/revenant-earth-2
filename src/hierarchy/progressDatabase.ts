import { game } from "../game";
import { ISerializable, KindedObject, primitive, primitiveObject, StateMode } from "./serialise";

export class ProgressDatabase implements ISerializable {
    db: Map<string, any> = new Map<string, any>();
    serialise(mode: StateMode): KindedObject | false {
        const entries = new Array<{ key: string, value: primitive }>();
        this.db.forEach((value, key) => {
            entries.push({ key, value });
        })
        return {
            kind: "ProgressDB",
            entries: entries
        };
    }
    static deserialise(data: { kind: "ProgressDB", entries: Array<{ key: string, value: any }> }) {
        game.progressDatabase.db = new Map<string, any>();
        for (const entry of data.entries) {
            game.progressDatabase.db.set(entry.key, entry.value);
        }
        return game.progressDatabase;
    }
    
}