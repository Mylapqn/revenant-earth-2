import { game } from "../game";
import { ISceneObject, Scene } from "../hierarchy/scene";
import { ISerializable, StateMode, KindedObject } from "../hierarchy/serialise";
import { Vectorlike } from "../utils/vector";

export class Atmo implements ISerializable, ISceneObject {
    atmoData: Array<AtmoData> = [];
    dataWidth = 100;
    waterLevel = 0;

    updateTimer = 0;
    updateRate = 0;

    co2 = 500;
    temp = 300;

    get celsius() {
        return this.temp - 273;
    }

    constructor() {
        game.activeScene.register(this);
        this.defaultAtmo(100);
    }

    defaultAtmo(width: number) {
        for (let index = 0; index < width; index++) {
            this.atmoData.push({ pollution: 0 });
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

    energyMove: Record<string, number> = {};

    energy(value: number, source?: string) {
        this.temp += value / this.heatCapacity;
        if (source) {
            if (!this.energyMove[source]) this.energyMove[source] = 0;
            this.energyMove[source] += value;
        }
    }

    updateProperties() {
        for (let index = 0; index < this.atmoData.length; index++) {
            this.process(this.atmoData[index], index * this.dataWidth);
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

        this.processGlobal();

        //console.log(`temp: ${this.celsius}, co2: ${this.co2}`);
        //console.log(this.energyMove);
        this.energyMove = {};
        
    }

    private spread(a: AtmoData, b: AtmoData) {
        let pollution = a.pollution - b.pollution;
        pollution *= 0.1;
        a.pollution -= pollution;
        b.pollution += pollution;
    }

    get heatCapacity() {
        return 400; //* this.atmoData.length;
    }

    processGlobal() {
        const influx = 340;
        const absorb = 0.7;
        const SB = 5.67 * 10 ** -8;

        let addWatts = influx * absorb;
        const co2Watts = co2ToWatts(this.co2);
        if (!isNaN(co2Watts) && co2Watts > 0) {
            this.energy(co2Watts, "co2");
        }

        this.energy(addWatts, "influx");

        const radiateWatts = this.temp ** 4 * SB;
        this.energy(-radiateWatts, "radiate");
    }

    private process(a: AtmoData, position: number) {}

    getProperties(x: number | Vectorlike) {
        if (typeof x === "object") x = x.x;
        let index = Math.round(x / this.dataWidth);
        if (index < 0) index = 0;
        const a = this.atmoData[index];
        return a;
    }

    generateHeat(joules: number) {
        this.temp += joules / this.heatCapacity;
    }

    generateCO2(grams: number) {
        this.co2 += grams / 1000; // lole
    }

    generatePollution(x: number | Vectorlike, grams: number) {
        const a = this.getProperties(x);
        a.pollution += grams / 1000;
    }

    captureCO2(filterRate: number, limit = 280) {
        if (this.co2 < limit) return 0;
        const grams = this.co2 * filterRate;
        this.co2 -= grams / 1000;
        return grams;
    }

    capturePollution(x: number | Vectorlike, filterRate: number, limit = 0) {
        const a = this.getProperties(x);
        if (a.pollution < limit) return 0;
        const grams = a.pollution * filterRate;
        a.pollution -= grams / 1000;
        return grams;
    }

    static deserialise(raw: any, scene?: Scene) {
        const data = raw as { kind: string; atmoData: Array<AtmoData> };
        game.atmo.atmoData = data.atmoData;
        if (scene) scene.register(game.atmo);
    }
}

export type AtmoData = {
    pollution: number;
};

function co2ToWatts(x: number) {
    return (x / (150 + x)) * 250;
}
