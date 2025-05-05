import { Assets, Texture } from "pixi.js";
import { ISerializable, KindedObject, ObjectKind, StateMode } from "./serialise";
import { game } from "../game";
import { ISceneObject, Scene } from "./scene";

export type AmbienceData = { music: string; sound: string; background: string };

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
}