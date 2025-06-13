import { Graphics, Sprite, Texture } from "pixi.js";
import { Game, game } from "../game";
import { ISceneObject, Scene } from "../hierarchy/scene";
import { ISerializable, KindedObject, StateMode } from "../hierarchy/serialise";
import { Vector } from "../utils/vector";
import { clamp, displayNumber, RandomGenerator } from "../utils/utils";
import { CloudMesh } from "./cloudMesh";
import { VolumeCurve } from "../sound/sound";
import { Debug } from "../dev/debug";
import { ParticleText } from "../hierarchy/particleText";

export class Weather implements ISerializable, ISceneObject {
    weatherData: WeatherData = {
        rainBuildup: 0,
        rainThreshold: 0,
        rainIntensity: 0,
        dayTime: 0
    }
    dayLength = 200;
    rainAngle: number = 0;
    rainRenderer: RainRenderer = new RainRenderer();
    random: RandomGenerator = new RandomGenerator();
    currentThunder: number = 0;
    thunderBuildup: number = 0;
    thunderThreshold: number = 0;
    thunderCount: number = 0;
    weatherSpeed = .5;
    rainFadeIn = 0;

    cloudMesh: CloudMesh;

    constructor() {
        game.activeScene.register(this);
        this.cloudMesh = new CloudMesh(Texture.WHITE);
        game.skyLayer.container.addChild(this.cloudMesh);
        //TODO fix cloud uvs so they look the same on different aspect ratios
        game.skyLayer.onResize = (width, height) => { this.cloudMesh.resize(width, height) }
        this.cloudMesh.resize(game.camera.pixelScreen.x + 1, game.camera.pixelScreen.y + 1)
    }
    serialise(mode: StateMode): KindedObject | false {
        return { kind: "Weather", weatherData: this.weatherData };
    }
    static deserialise(raw: { kind: string; weatherData: WeatherData }, scene?: Scene) {
        const data = raw;
        Object.assign(game.weather.weatherData, data.weatherData);
        if (data.weatherData.rainIntensity > 0) {
            game.soundManager.soundLibrary.play("rain_heavy");
            game.soundManager.soundLibrary.play("rain_light");
        }
        if (scene) scene.register(game.weather);
    }
    unload(): void {
        game.activeScene.unregister(this);
        game.soundManager.soundLibrary.pause("rain_heavy");
        game.soundManager.soundLibrary.pause("rain_light");
    }
    update(dt: number): void {
        this.weatherData.dayTime += dt;
        while (this.weatherData.dayTime > this.dayLength) this.weatherData.dayTime -= this.dayLength;
        if (this.weatherData.rainThreshold == 0) this.weatherData.rainThreshold = this.random.range(10, 40);
        if (this.weatherData.rainIntensity > 0) {
            this.rainFadeIn = clamp(this.rainFadeIn + dt * .2);
            const rainRatio = this.weatherData.rainBuildup / this.weatherData.rainThreshold;
            const rainMult = rainRatio + .01;
            const rainVolume = clamp(1 - rainRatio, 0, 1);
            game.soundManager.soundLibrary.volume("rain_heavy", VolumeCurve.curves.rainHeavy.apply(rainVolume) * this.rainFadeIn);
            game.soundManager.soundLibrary.volume("rain_light", VolumeCurve.curves.rainLight.apply(rainVolume) * this.rainFadeIn);

            //Debug.log("rainRatio:      " + displayNumber(rainRatio));
            //Debug.log("rainCurveHeavy: " + displayNumber(VolumeCurve.curves.rainHeavy.apply(1 - rainRatio)));
            //Debug.log("rainCurveLight: " + displayNumber(VolumeCurve.curves.rainLight.apply(1 - rainRatio)));

            this.weatherData.rainBuildup -= dt * this.weatherData.rainIntensity * this.weatherSpeed;
            const pos = game.camera.worldPosition.x + (Math.random() - .5) * game.camera.pixelScreen.x * 1.5;
            if (pos > 0) {
                const tdata = game.terrain.getProperties(pos);
                game.terrain.consumeFertility(pos, dt * this.weatherData.rainIntensity * rainMult * tdata.erosion * tdata.erosion * 1000);
                game.terrain.addMoisture(pos, dt * this.weatherData.rainIntensity * rainMult);
                game.atmo.energy(dt * this.weatherData.rainIntensity * rainMult * 1000, "condensation");
            }
            if (this.weatherData.rainBuildup < 0) {
                //stop rain
                game.soundManager.soundLibrary.pause("rain_heavy");
                game.soundManager.soundLibrary.pause("rain_light");
                this.weatherData.rainBuildup = 0;
                this.weatherData.rainIntensity = 0;
                this.weatherData.rainThreshold = this.random.range(10, 40);
            }
            if (this.weatherData.rainIntensity > 1) {
                this.thunderBuildup += dt * rainRatio;
                if (this.thunderBuildup > this.thunderThreshold) {
                    //thunder
                    this.currentThunder = 1;
                    this.thunderBuildup = 0;
                    this.thunderCount = this.random.int(1, 3);
                    game.soundManager.playOneshot("thunder");
                }
                if (this.currentThunder > 0) {
                    this.currentThunder *= 1 - dt * 2;
                    if (this.currentThunder < .3 && this.thunderCount > 0) {
                        this.currentThunder = 1;
                        this.thunderCount--;
                    }
                    else if (this.currentThunder <= .01) {
                        this.currentThunder = 0;
                    }
                }
            }

        }
        else if (this.weatherData.rainBuildup > this.weatherData.rainThreshold) {
            //start rain
            this.thunderBuildup = this.random.range(10, 40);
            this.thunderThreshold = this.random.range(10, 20);
            this.weatherData.rainIntensity = this.random.range(.2, 2) * (1 + game.atmo.overheat * .05);
            this.rainAngle = this.random.range(-.5, .5);
            game.soundManager.soundLibrary.play("rain_heavy");
            game.soundManager.soundLibrary.play("rain_light");
        }
        else {
            this.weatherData.rainBuildup += dt * game.atmo.temp * .002 * this.weatherSpeed;
            const rainBuildupRatio = this.weatherData.rainBuildup / this.weatherData.rainThreshold;
            if (game.ambience.sound != "")
                game.soundManager.soundLibrary.volume(game.ambience.sound, VolumeCurve.curves.windFromRainBuildup.apply(rainBuildupRatio));
        }
    }
    draw(dt: number): void {
        if (this.weatherData.rainThreshold == 0) return;
        this.rainRenderer.draw(dt);
        this.cloudMesh.setUniform("uClouds", 1 - clamp(this.weatherData.rainBuildup / 30));
        let sunAngle = (this.weatherData.dayTime / this.dayLength + .5) * Math.PI * 2;
        let sunVector = Vector.fromAngle(sunAngle);
        sunVector.vecmult({ x: .25, y: .4 });
        sunVector.add({ x: .5, y: .5 });
        this.cloudMesh.setUniform("uSunPosition", [sunVector.x, sunVector.y]);
        this.cloudMesh.setUniform("uResolution", [game.camera.pixelScreen.x, game.camera.pixelScreen.y]);
        this.cloudMesh.setUniform("uAmbient", game.ambience.ambientColor().toShader());
        this.cloudMesh.setUniform("uDistanceFogColor", game.ambience.fogColor().distance);
        this.cloudMesh.setUniform("uGroundFogColor", game.ambience.fogColor().ground);
        this.cloudMesh.setUniform("uCloudColor", game.ambience.fogColor().cloud);

    }
}

export type WeatherData = {
    rainBuildup: number,
    rainThreshold: number,
    rainIntensity: number,
    dayTime: number
}

class RainRenderer {
    raindrops: RainParticle[];
    raindropBuildup: number = 0;
    constructor() {
        this.raindrops = [];
    }
    draw(dt: number) {
        const rainSpeed = 600;
        this.raindropBuildup += 800 * dt * game.weather.weatherData.rainIntensity * game.weather.weatherData.rainBuildup / game.weather.weatherData.rainThreshold;
        this.raindropBuildup = clamp(this.raindropBuildup, 0, 100);
        while (this.raindropBuildup > 1) {
            this.raindropBuildup -= 1;
            const raindrop = new RainParticle(new Vector(game.camera.worldPosition.x + (Math.random() - .5) * game.camera.pixelScreen.x * 1.5, game.camera.worldPosition.y - game.camera.pixelScreen.y / 2), game.weather.rainAngle);
            this.raindrops.push(raindrop);
            let hit = game.collisionSystem.raycast(raindrop.position.clone().add(Vector.fromAngle(raindrop.angle).mult(-200)), raindrop.position.clone().add(Vector.fromAngle(raindrop.angle).mult(500)), (body) => { return body.userData?.terrain });
            if (hit) {
                raindrop.groundY = hit.point.y;
            }
        }
        for (const raindrop of [...this.raindrops]) {
            const dir = Vector.fromAngle(raindrop.angle)
            raindrop.position.add(dir.mult(dt * rainSpeed));
            raindrop.graphics.scale.y = dt * rainSpeed * 2;

            raindrop.graphics.position.set(raindrop.position.x, raindrop.position.y);
            if ((raindrop.position.y > game.camera.worldPosition.y + game.camera.pixelScreen.y / 2) ||
                (raindrop.groundY && raindrop.position.y > raindrop.groundY)) {
                this.raindrops.splice(this.raindrops.indexOf(raindrop), 1)
                raindrop.graphics.destroy();
            };
        }
    }
}

class RainParticle {
    position: Vector;
    angle: number;
    graphics: Sprite;
    groundY?: number;
    constructor(position: Vector, angle: number) {
        this.angle = game.weather.random.range(-.1, .1) + angle + Math.PI / 2;
        this.position = position;
        this.graphics = new Sprite(Texture.WHITE);
        game.weatherContainer.addChild(this.graphics);
        this.graphics.alpha = game.weather.random.range(.5, .9);
        this.graphics.scale.set(1, 20);
        this.graphics.tint = 0xaaccff;
        this.graphics.rotation = this.angle + Math.PI / 2;
    }
}