import { Text } from "pixi.js";
import { Vector } from "../vector";
import { game } from "../game";


export class ParticleText {
    static list: ParticleText[] = [];
    position: Vector = new Vector(0, 0);
    velocity: Vector = new Vector(0, -10);
    age: number = 0;
    lifespan: number = 3;
    color: number = 0;
    text = "Text";
    graphics: Text;
    constructor(text: string, position: Vector) {
        this.graphics = new Text({ text: text, anchor: { x: 0.51, y: 0.51 }, roundPixels: true });
        this.graphics.style.fill = 0x333300;
        this.graphics.style.fontSize = 16;
        this.graphics.resolution = 3;
        this.graphics.style.fontFamily = "monogramextended";
        this.graphics.style.align = "center";
        game.pixelLayer.container.addChild(this.graphics);
        this.position = position.result();
        this.graphics.position.set(this.position.x, this.position.y);
        ParticleText.list.push(this);
    }
    update(dt: number) {
        this.age += dt;
        this.graphics.alpha = 1 - (this.age / this.lifespan);
        this.position.add(this.velocity.result().mult(dt));
        const rounded = this.position.result().floor();
        this.graphics.position.set(rounded.x, rounded.y);
        if (this.age > this.lifespan) { this.graphics.destroy(); ParticleText.list.splice(ParticleText.list.indexOf(this), 1); }
    }
}