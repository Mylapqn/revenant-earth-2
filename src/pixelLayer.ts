import { Container, Graphics, RenderTexture, Sprite } from "pixi.js";
import { app } from "./app";

export class PixelLayer {
    container: Container;
    renderTexture: RenderTexture;
    sprite: Sprite;
    constructor(width: number, height: number) {
        this.container = new Container({ width, height });
        this.renderTexture = RenderTexture.create({ width, height, antialias: false, scaleMode: 'nearest' });
        this.sprite = new Sprite(this.renderTexture);
        let graphics = new Graphics;
        graphics.circle(10, 10, 10);
        graphics.fill(0xff0000);
        this.container.addChild(graphics);
    }
    render() {
        app.renderer.render({ container: this.container, target: this.renderTexture });
        this.renderTexture.update();
    }
}