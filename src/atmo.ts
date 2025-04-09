import { game } from "./game";
import { ISceneObject, Scene } from "./hierarchy/scene";
import { ISerializable, StateMode, KindedObject } from "./hierarchy/serialise";
import { Vectorlike } from "./vector";

export class Atmo implements ISerializable, ISceneObject {
    atmoData: Array<AtmoData> = [];
    dataWidth = 100;

    updateTimer = 0;
    updateRate = 0;
    constructor() {
        game.activeScene.register(this);
        this.defaultAtmo(100);
    }

    defaultAtmo(width: number) {
        for (let index = 0; index < width; index++) {
            this.atmoData.push({ temp: 340, co2: 280, pollution: 0 });
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

    draw?(dt: number): void {}

    serialise(mode: StateMode): KindedObject | false {
        return { kind: "Atmo", atmoData: this.atmoData };
    }

    updateProperties() {
        for (let index = 0; index < this.atmoData.length; index++) {
            this.process(this.atmoData[index]);
        }

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

    private process(a: AtmoData) {
        const influx = 340;
        const absorb = 0.7;
        const heatCapacity = 400;
        const SB = 5.67 * 10 ** -8;

        let addWatts = influx * absorb;
        const co2Watts = co2ToWatts(a.co2);
        if (!isNaN(co2Watts) && co2Watts > 0) {
            addWatts += co2Watts;
        }

        a.temp += addWatts / heatCapacity;

        const radiateWatts = a.temp ** 4 * SB;
        a.temp -= radiateWatts / heatCapacity;
    }

    static displayValues(a: AtmoData) {
        return {
            celsius: a.temp - 273.15,
            co2Ppm: a.co2,
            pollution: a.pollution,
        };
    }

    getProperties(x: number | Vectorlike) {
        if (typeof x === "object") x = x.x;
        let index = Math.round(x / this.dataWidth);
        if (index < 0) index = 0;
        const a = this.atmoData[index];
        return a;
    }

    static deserialise(raw: any, scene?: Scene) {
        const data = raw as { kind: string; atmoData: Array<AtmoData> };
        game.atmo.atmoData = data.atmoData;
        if (scene) scene.register(game.atmo);
    }
}

export type AtmoData = {
    temp: number;
    co2: number;
    pollution: number;
};

function co2ToWatts(x: number) {
    return (x / (150 + x)) * 250;
}
