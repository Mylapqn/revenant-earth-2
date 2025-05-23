import { Graphics, Sprite, Texture } from "pixi.js";
import { Game, game } from "../game";
import { ISceneObject, Scene } from "../hierarchy/scene";
import { ISerializable, KindedObject, StateMode } from "../hierarchy/serialise";
import { Vector } from "../utils/vector";
import { displayNumber, RandomGenerator } from "../utils/utils";
import { CloudMesh } from "./cloudMesh";
import { VolumeCurve } from "../sound/sound";
import { Debug } from "../dev/debug";

export class Weather implements ISerializable, ISceneObject {
    weatherData: WeatherData = {
        rainBuildup: 0,
        rainThreshold: 0,
        rainIntensity: 0,
    }
    rainAngle: number = 0;
    rainRenderer: RainRenderer = new RainRenderer();
    random: RandomGenerator = new RandomGenerator();

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
        game.weather.weatherData = data.weatherData;
        if(data.weatherData.rainIntensity > 0){
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
        if (this.weatherData.rainThreshold === 0) this.weatherData.rainThreshold = this.random.range(10, 40);
        if (this.weatherData.rainIntensity > 0) {
            const rainRatio = this.weatherData.rainBuildup / this.weatherData.rainThreshold;
            const rainMult = rainRatio + .01;
            game.soundManager.soundLibrary.volume("rain_heavy", VolumeCurve.curves.rainHeavy.apply(1 - rainRatio));
            game.soundManager.soundLibrary.volume("rain_light", VolumeCurve.curves.rainLight.apply(1 - rainRatio));

            Debug.log("rainRatio:      " + displayNumber(rainRatio));
            Debug.log("rainCurveHeavy: " + displayNumber(VolumeCurve.curves.rainHeavy.apply(1 - rainRatio)));
            Debug.log("rainCurveLight: " + displayNumber(VolumeCurve.curves.rainLight.apply(1 - rainRatio)));

            this.weatherData.rainBuildup -= dt * this.weatherData.rainIntensity;
            const pos = game.camera.worldPosition.x + (Math.random() - .5) * game.camera.pixelScreen.x * 1.5;
            if (pos > 0) {
                game.terrain.addMoisture(pos, dt * this.weatherData.rainIntensity * rainMult);
                game.atmo.energy(dt * this.weatherData.rainIntensity * rainMult * 10000, "condensation");
            }
            if (this.weatherData.rainBuildup < 0) {
                //stop rain
                game.soundManager.soundLibrary.pause("rain_heavy");
                game.soundManager.soundLibrary.pause("rain_light");
                this.weatherData.rainBuildup = 0;
                this.weatherData.rainIntensity = 0;
                this.weatherData.rainThreshold = this.random.range(10, 40);
            }
        }
        else if (this.weatherData.rainBuildup > this.weatherData.rainThreshold) {
            //start rain
            this.weatherData.rainIntensity = this.random.range(.2, 2);
            this.rainAngle = this.random.range(-.5, .5);
            game.soundManager.soundLibrary.play("rain_heavy");
            game.soundManager.soundLibrary.play("rain_light");
        }
        else {
            this.weatherData.rainBuildup += dt * game.atmo.temp * .002;
            const rainBuildupRatio = this.weatherData.rainBuildup / this.weatherData.rainThreshold;
            if (game.ambience.sound != "")
                game.soundManager.soundLibrary.volume(game.ambience.sound, VolumeCurve.curves.windFromRainBuildup.apply(rainBuildupRatio));
        }
    }
    draw(dt: number): void {
        this.rainRenderer.draw(dt);
        this.cloudMesh.setUniform("uClouds", 1 - (this.weatherData.rainBuildup / this.weatherData.rainThreshold));
        this.cloudMesh.setUniform("uSunPosition", [game.input.mouse.position.x / game.camera.screen.x, game.input.mouse.position.y / game.camera.screen.y]);
        this.cloudMesh.setUniform("uResolution", [game.camera.pixelScreen.x, game.camera.pixelScreen.y]);

    }
}

export type WeatherData = {
    rainBuildup: number,
    rainThreshold: number,
    rainIntensity: number
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
        this.graphics.tint = 0x88aabb;
        this.graphics.rotation = this.angle + Math.PI / 2;
    }
}