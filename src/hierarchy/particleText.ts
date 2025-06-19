import { Text } from "pixi.js";
import { Vector } from "../utils/vector";
import { game } from "../game";
import { Lightmap } from "../shaders/lighting/lightmap";
import { MouseButton } from "../input";


export class ParticleText {
    static list: ParticleText[] = [];
    position: Vector = new Vector(0, 0);
    velocity: Vector = new Vector(0, -10);
    age: number = 0;
    lifespan: number = 3;
    color: number = 0;
    text = "Text";
    graphics: Text;
    constructor(text: string, position: Vector, lifespan: number = 3) {
        this.graphics = new Text({ text: text, anchor: { x: 0, y: 0 }, roundPixels: true });
        this.graphics.style.fill = 0xffffff;
        this.graphics.style.fontSize = 16;
        this.graphics.resolution = 3;
        this.graphics.style.fontFamily = "monogram";
        this.graphics.style.align = "center";
        this.graphics.cacheAsTexture({ antialias: false });
        //this.graphics.renderable = false;
        this.position = position.clone();
        this.lifespan = lifespan;
        this.draw(0);
        game.worldUiLayer.addChild(this.graphics);
        ParticleText.list.push(this);
    }
    update(dt: number) {
        //game.app.renderer.render({ container: this.graphics, target: Lightmap.texture, clear: false, transform: this.graphics.worldTransform });

        this.age += dt;
        this.graphics.alpha = 1 - (this.age / this.lifespan);
        this.position.add(this.velocity.clone().mult(dt));
        this.draw(dt);
        if (this.age > this.lifespan) { this.graphics.destroy(); ParticleText.list.splice(ParticleText.list.indexOf(this), 1); }
    }
    draw(dt: number) {
        const rounded = this.position.clone().sub({ x: this.graphics.width / 2, y: this.graphics.height / 2 }).floor();
        this.graphics.position.set(rounded.x, rounded.y);
    }
}