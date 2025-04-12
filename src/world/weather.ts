import { Graphics, Sprite, Texture } from "pixi.js";
import { Game, game } from "../game";
import { ISceneObject, Scene } from "../hierarchy/scene";
import { ISerializable, KindedObject, StateMode } from "../hierarchy/serialise";
import { Vector } from "../utils/vector";
import { RandomGenerator } from "../utils/utils";

export class Weather implements ISerializable, ISceneObject {
    weatherData: WeatherData = {
        rainBuildup: 0,
        rainThreshold: 0,
        rainIntensity: 0
    }
    rainRenderer: RainRenderer = new RainRenderer();
    random: RandomGenerator = new RandomGenerator();

    constructor() {
        game.activeScene.register(this);
    }
    serialise(mode: StateMode): KindedObject | false {
        return { kind: "Weather", weatherData: this.weatherData };
    }
    static deserialise(raw: any, scene?: Scene) {
        const data = raw as { kind: string; weatherData: WeatherData };
        game.weather.weatherData = data.weatherData;
        if (scene) scene.register(game.weather);
    }
    unload(): void {
        game.activeScene.unregister(this);
    }
    update(dt: number): void {
        if(this.weatherData.rainThreshold === 0) this.weatherData.rainThreshold = this.random.range(10, 40);
        if (this.weatherData.rainIntensity > 0) {
            const rainMult = this.weatherData.rainBuildup / this.weatherData.rainThreshold + .1;
            this.weatherData.rainBuildup -= dt * this.weatherData.rainIntensity;
            const tdata = game.terrain.getProperties(game.camera.worldPosition.x + (Math.random() - .5) * game.camera.pixelScreen.x * 1.5);
            tdata.moisture += dt * this.weatherData.rainIntensity * rainMult * 10;
            if (this.weatherData.rainBuildup < 0) {
                this.weatherData.rainBuildup = 0;
                this.weatherData.rainIntensity = 0;
                this.weatherData.rainThreshold = this.random.range(10, 40);
            }
        }
        else if (this.weatherData.rainBuildup > this.weatherData.rainThreshold) {
            this.weatherData.rainIntensity = this.random.range(.2, 2);
        }
        else {
            this.weatherData.rainBuildup += dt * game.atmo.temp * .005;
        }
    }
    draw(dt: number): void {
        this.rainRenderer.draw(dt);
    }
}

export type WeatherData = {
    rainBuildup: number,
    rainThreshold: number,
    rainIntensity: number
}

class RainRenderer {
    raindrops: RainParticle[];
    constructor() {
        this.raindrops = [];
    }
    draw(dt: number) {
        const rainSpeed = 500;
        for (let i = 0; i < 800 * dt * game.weather.weatherData.rainIntensity * game.weather.weatherData.rainBuildup / game.weather.weatherData.rainThreshold; i++) {
            this.raindrops.push(new RainParticle(new Vector(game.camera.worldPosition.x + (Math.random() - .5) * game.camera.pixelScreen.x * 1.5, game.camera.worldPosition.y - game.camera.pixelScreen.y / 2)));
        }
        for (const raindrop of [...this.raindrops]) {
            const dir = Vector.fromAngle(raindrop.angle)
            raindrop.position.add(dir.mult(dt * rainSpeed));
            raindrop.graphics.scale.y = dt * rainSpeed*2;

            raindrop.graphics.position.set(raindrop.position.x, raindrop.position.y);
            if (raindrop.position.y > game.camera.worldPosition.y + game.camera.pixelScreen.y / 2) {
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
    constructor(position: Vector) {
        this.angle = game.weather.random.range(.3, .5) + Math.PI / 2;
        this.position = position;
        this.graphics = new Sprite(Texture.WHITE);
        game.weatherContainer.addChild(this.graphics);
        this.graphics.alpha = .5;
        this.graphics.scale.set(1, 20);
        this.graphics.tint = 0x8899aa;
        this.graphics.rotation = this.angle + Math.PI / 2;
    }
}