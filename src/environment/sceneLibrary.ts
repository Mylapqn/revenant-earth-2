import { Assets } from "pixi.js";
import { Vectorlike } from "../utils/vector";
import { KindedObject } from "../hierarchy/serialise";

export class SceneLibrary {
    private library: Map<string, KindedObject[]> = new Map();
    async init() {
        await this.add("factory-dungeon");
        await this.add("seed-dungeon");
        await this.add("space-station");
    }
    async add(name: string, fileName?: string) {
        if (!fileName) fileName = name;
        this.library.set(name, await Assets.load("./scenes/" + fileName + ".json"));
    }
    get(name: string) {
        if(!this.library.has(name)) throw new Error("No scene data with name " + name);
        return this.library.get(name) as KindedObject[];
    }
}