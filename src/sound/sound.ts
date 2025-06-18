import { Options, sound as pixiSound, PlayOptions, Sound, SoundLibrary } from "@pixi/sound";
import { game } from "../game";
import { ParticleText } from "../hierarchy/particleText";
import { Vector, Vectorlike } from "../utils/vector";
import { Assets } from "pixi.js";
import { lerp } from "../utils/utils";

export class SoundManager {
    soundLibrary = pixiSound;
    oneshots: Map<string, Array<Sound>> = new Map<string, Array<Sound>>();
    public playOneshot(sound: string) {
        //get random oneshot
        if (!this.oneshots.has(sound)) return;
        const index = Math.floor(Math.random() * this.oneshots.get(sound)!.length);
        const oneshot = this.oneshots.get(sound)![index];
        oneshot.play();
    }
    async loadOneshot(name: string, sound: string, volume = 1) {
        const oneshot = await Assets.load(sound) as Sound;
        oneshot.volume = volume;
        if (!this.oneshots.has(name)) this.oneshots.set(name, []);
        this.oneshots.get(name)!.push(oneshot);
    }
    async loadOneshotRange(name: string, urlBaseWithPercent: string, count: number, start?: number, volume = 1) {
        const startNum = start ?? 0;
        for (let i = startNum; i < count + startNum; i++) {
            const url = urlBaseWithPercent.replace("%", i.toString());
            await this.loadOneshot(name, url, volume);
        }
    }
    async loadSound(alias: string, options: Options) {
        if (!options.url) return null;
        options.preload = true;
        const sound = await new Promise<Sound>((resolve, reject) => Sound.from({
            ...options,
            loaded(err, sound) {
                if (err || !sound) {
                    reject(err);
                }
                else {
                    resolve(sound);
                }
            },
        }));
        this.soundLibrary.add(alias, sound);
        return sound;
    }
    public play(sound: string, options?: PlayOptions) { if (game.loaded) this.soundLibrary.play(sound, options); }
    public stop(sound: string) { if (game.loaded) this.soundLibrary.stop(sound); }
    async loadSounds() {
        pixiSound.volumeAll = .5;
        await Promise.all([
            this.loadOneshotRange("footstep_dirt", "./sound/footsteps/dirt/footsmuddry_%.wav", 5, 1),
            this.loadOneshotRange("footstep_metal", "./sound/footsteps/metal/footsteps_metal-%.mp3", 5, 1, .3),
            this.loadOneshotRange("thunder", "./sound/sfx/thunder/thunder_%.mp3", 3, 1),
            this.loadSound("rain_heavy", { url: "./sound/ambient/rain_heavy.mp3", loop: true }),
            this.loadSound("rain_light", { url: "./sound/ambient/rain_light.mp3", loop: true }),
            this.loadSound("wind", { url: "./sound/ambient/wind.mp3", loop: true, singleInstance: true, autoPlay: false }),
            this.loadSound("space", { url: "./sound/ambient/space.mp3", loop: true, singleInstance: true, autoPlay: false }),
            this.loadSound("score", { url: "./sound/ui/score2.mp3", loop: false, singleInstance: false, speed: 2, autoPlay: false }),
            this.loadSound("milestone", { url: "./sound/ui/milestone.mp3", loop: false, singleInstance: false, autoPlay: false }),
            this.loadSound("click", { url: "./sound/ui/pack/RevenantEarth_UI_clickMain_v2.wav", loop: false, singleInstance: false, autoPlay: false }),
            this.loadSound("hover", { url: "./sound/ui/pack/RevenantEarth_UI_hover_v2.wav", loop: false, singleInstance: false, autoPlay: false, volume: .5 }),
            this.loadSound("quest_issue", { url: "./sound/ui/quest_issue.mp3", loop: false, singleInstance: false, autoPlay: false }),
            this.loadSound("sprinkler", { url: "./sound/sfx/sprinkler.mp3", loop: false, singleInstance: false, autoPlay: false, volume: .2 }),
            this.loadSound("music_menu", { url: "./sound/music/menu.mp3", loop: true, singleInstance: true, autoPlay: false, volume: .5 }),
        ]);
    }
}

export class VolumeCurve {
    stops: Array<Vectorlike> = [];
    constructor(stops: Array<Vectorlike>) {
        this.stops = stops;
    }
    apply(t: number) {
        for (let i = 0; i < this.stops.length - 1; i++) {
            const start = this.stops[i];
            const end = this.stops[i + 1];
            if (t >= start.x && t < end.x) {
                const lerpT = (t - start.x) / (end.x - start.x);
                return lerp(start.y, end.y, lerpT);
            }
        }
        return this.stops[this.stops.length - 1].y;
    }
    static curves = {
        rainHeavy: new VolumeCurve([{ x: 0, y: 1 }, { x: 0.05, y: 1 }, { x: .5, y: .5 }, { x: .8, y: .1 }, { x: 1, y: 0 }]),
        rainLight: new VolumeCurve([{ x: 0, y: 0 }, { x: 0.05, y: 0 }, { x: .5, y: 0 }, { x: .8, y: .8 }, { x: 1, y: 0 }]),
        windFromRainBuildup: new VolumeCurve([{ x: 0, y: 0.1 }, { x: .2, y: .3 }, { x: .2, y: .5 }, { x: 1, y: 0.1 }]),
    }
}