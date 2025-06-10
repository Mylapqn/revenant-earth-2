import { Assets, Texture } from "pixi.js";
import { ISerializable, KindedObject, ObjectKind, StateMode } from "./serialise";
import { game } from "../game";
import { ISceneObject, Scene } from "./scene";
import { CustomColor } from "../utils/color";

export type AmbienceData = { music: string; sound: string; background: string; ambientColor: [number, number, number] };

export class Ambience implements ISceneObject, ISerializable {
    kind: ObjectKind = "Ambience";
    music: string = "";
    sound: string = "";
    background: Texture;
    data: AmbienceData;
    constructor(data: AmbienceData) {
        this.data = data;
        this.music = data.music;
        this.sound = data.sound;
        if (this.sound != "")
            game.soundManager.soundLibrary.play(this.sound);
        this.background = Assets.get(data.background);
    }
    serialise(mode: StateMode): KindedObject | false {
        return { kind: this.kind, ambienceData: this.data };
    }
    static deserialise(raw: { kind: string; ambienceData: AmbienceData }, scene?: Scene) {
        const data = raw;
        game.ambience = new Ambience(data.ambienceData);
        if (scene) scene.register(game.ambience);
    }
    unload(): void {
        if (this.sound != "")
            game.soundManager.soundLibrary.pause(this.sound);
    }
    currentAmbience() {
        const dayRatio = (Math.sin((game.weather.weatherData.dayTime / game.weather.dayLength + .5) * Math.PI * 2) * .5 + .5) || 0;
        let ambientColor = CustomColor.fromShader(game.ambience.data.ambientColor);
        ambientColor = ambientColor.mix(ambientColor.mult(new CustomColor(150, 160, 180)), (game.weather.weatherData.rainBuildup / game.weather.weatherData.rainThreshold) || 0);

        return ambientColor.mix(new CustomColor(60, 10, 100), dayRatio);
    }
}