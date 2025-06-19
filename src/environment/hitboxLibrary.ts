import { Assets } from "pixi.js";
import { Vectorlike } from "../utils/vector";

export class HitboxLibrary {
    private library: Map<string, Vectorlike[]> = new Map();
    async init() {
        await this.add("factory-dungeon");
        await this.add("seed-dungeon");
        await this.add("seed-dungeon-inner");
        await this.add("space-station");
    }
    async add(name: string, fileName?: string) {
        if (!fileName) fileName = name;
        this.library.set(name, await Assets.load("./hitboxes/" + fileName + ".json"));
    }
    get(name: string) {
        if(!this.library.has(name)) throw new Error("No hitbox with name " + name);
        return this.library.get(name) as Vectorlike[];
    }
}