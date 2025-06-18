import { Debug } from "../dev/debug";
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

    co2 = 600;
    temp = 300;

    get overheat() {
        return Math.max(0, this.temp - 273 - 20);
    }

    get celsius() {
        return this.temp - 273;
    }

    constructor() {
        game.activeScene.register(this);
        this.defaultAtmo(100);
    }

    defaultAtmo(width: number) {
        for (let index = 0; index < width; index++) {
            this.atmoData.push({ pollution: 1 });
        }
    }

    unload?(): void {
        game.activeScene.unregister(this);
    }

    update(dt: number): void {
        this.updateTimer += dt;
        if (this.updateTimer > this.updateRate) {
            this.updateTimer = 0;
            this.updateProperties(dt * 60);
        }
    }

    draw?(dt: number): void { }



    energyMove: Record<string, number> = {};
    energyMoveTotal: Record<string, number> = {};

    energy(value: number, source?: string) {
        this.temp += value / this.heatCapacity;
        if (source) {
            if (!this.energyMove[source]) this.energyMove[source] = 0;
            if (!this.energyMoveTotal[source]) this.energyMoveTotal[source] = 0;
            this.energyMove[source] += value;
            this.energyMoveTotal[source] += value;
        }
    }

    updateProperties(dt: number) {
        for (let index = 0; index < this.atmoData.length; index++) {
            this.process(this.atmoData[index], index * this.dataWidth, dt);
        }

        for (let index = 0; index < this.atmoData.length - 1; index++) {
            const a = this.atmoData[index];
            const b = this.atmoData[index + 1];
            this.spread(a, b, dt);
        }

        for (let index = this.atmoData.length - 1; index > 0; index--) {
            const a = this.atmoData[index];
            const b = this.atmoData[index - 1];
            this.spread(a, b, dt);
        }

        this.processGlobal(dt);

        //Object.entries(game.atmo.energyMove).forEach(([k, v]) => Debug.log(k + ": " + v.toFixed(1)));

        this.energyMove = {};

    }

    private spread(a: AtmoData, b: AtmoData, dt: number) {
        let pollution = a.pollution - b.pollution;
        pollution *= 0.01 * dt;
        a.pollution -= pollution;
        b.pollution += pollution;
    }

    get heatCapacity() {
        return 400 * this.atmoData.length * 2;
    }

    processGlobal(dt: number) {
        //const influx = 340;
        const influx = Math.max((game.weather.dayRatio - 0.25) * 1.25 * 1000, 0);
        Debug.log(`game.weather.dayRatio: ${game.weather.dayRatio}`);

        const reflect = (game.weather.weatherData.rainBuildup / 30) * 0.8;

        const absorb = 0.7;
        const SB = 5.67 * 10 ** -8;

        let addWatts = influx * absorb;
        let reflected = addWatts * reflect;
        const co2Watts = co2ToWatts(this.co2) * 1.5;
        if (!isNaN(co2Watts) && co2Watts > 0) {
            this.energy(co2Watts * dt, "co2");
        }

        this.energy(addWatts * dt, "influx");
        this.energy(-reflected * dt, "reflected");

        const radiateWatts = this.temp ** 4 * SB;
        this.energy(-radiateWatts * dt, "radiate");
    }

    private process(a: AtmoData, position: number, dt: number) { }

    getProperties(x: number | Vectorlike) {
        if (typeof x === "object") x = x.x;
        let index = Math.round(x / this.dataWidth);
        if (index < 0) index = 0;
        let a = this.atmoData[index];
        if (a === undefined) a = { pollution: 0 };
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

    serialise(mode: StateMode): KindedObject | false {
        return { kind: "Atmo", atmoData: this.atmoData, temp: this.temp, co2: this.co2 };
    }

    static deserialise(raw: any, scene?: Scene) {
        const data = raw as { kind: string; atmoData: Array<AtmoData>; temp: number; co2: number };
        game.atmo.atmoData = data.atmoData;
        game.atmo.temp = data.temp || 0;
        game.atmo.co2 = data.co2 || 0;
        if (scene) scene.register(game.atmo);
    }
}

export type AtmoData = {
    pollution: number;
};

function co2ToWatts(x: number) {
    return (x / (150 + x)) * 250;
}
