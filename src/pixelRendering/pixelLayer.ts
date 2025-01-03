import { Container, Graphics, RenderTexture, Sprite } from "pixi.js";
import { game } from "../game";
import { PixelSprite } from "./pixelSprite";

export class PixelLayer {
    container: Container;
    renderTexture: RenderTexture;
    sprite: Sprite;
    constructor(width: number, height: number) {
        this.container = new Container({ width, height });
        this.renderTexture = RenderTexture.create({ width, height, antialias: false, scaleMode: 'nearest' });
        this.sprite = new PixelSprite();
        this.sprite.texture = this.renderTexture;
        this.sprite.scale.set(4);
        let graphics = new Graphics;
        graphics.circle(200, 50, 10);
        graphics.fill(0xff0000);
        this.container.addChild(graphics);
    }
    
    render() {
        game.app.renderer.render({ container: this.container, target: this.renderTexture });
        this.renderTexture.update();
    }
}