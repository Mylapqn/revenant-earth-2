import { game } from "./game";
import { ISceneObject } from "./hierarchy/scene";
import { ISerializable, StateMode, KindedObject } from "./hierarchy/serialise";
import { Vectorlike } from "./vector";

export class Atmo implements ISerializable, ISceneObject {
    atmoData: Array<AtmoData> = [];
    dataWidth = 100;

    updateTimer = 0;
    updateRate = 10;
    constructor() {
        game.activeScene.register(this);
        this.defaultAtmo(100);
    }

    defaultAtmo(width: number) {
        for (let index = 0; index < width; index++) {
            this.atmoData.push({ temp: 1 });
        }
    }

    unload?(): void {
        throw new Error("Method not implemented.");
    }
    update(dt: number): void {
        this.updateTimer += dt;
        if (this.updateTimer > this.updateRate) {
            this.updateTimer = 0;
            this.updateProperties();
        }
    }
    draw?(dt: number): void {
        throw new Error("Method not implemented.");
    }
    serialise(mode: StateMode): KindedObject | false {
        throw new Error("Method not implemented.");
    }

    updateProperties() {
        for (let index = 0; index < this.atmoData.length - 1; index++) {
            const a = this.atmoData[index];
            const b = this.atmoData[index + 1];
            this.spread(a, b);
        }

        for (let index = this.atmoData.length - 1; index > 0; index--) {
            const a = this.atmoData[index];
            const b = this.atmoData[index - 1];
            this.spread(a, b);
        }
    }

    private spread(a: AtmoData, b: AtmoData) {
        let temp = a.temp - b.temp;
        temp *= 0.01;
        a.temp -= temp;
        b.temp += temp;
    }

    getProperties(x: number | Vectorlike) {
        if (typeof x === "object") x = x.x;
        let index = Math.round(x / this.dataWidth);
        if (index >= this.atmoData.length) index = this.atmoData.length - 1;
        if (index < 0) index = 0;
        const a = this.atmoData[index];
        return a;
    }
}

export type AtmoData = {
    temp: number;
};
