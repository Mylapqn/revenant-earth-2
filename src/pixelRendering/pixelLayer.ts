import { Container, Graphics, RenderTexture, Sprite } from "pixi.js";
import { game } from "../game";
import { PixelSprite } from "./pixelSprite";

export class PixelLayer {
    container: Container;
    renderTexture: RenderTexture;
    sprite: Sprite;
    worldSpace: boolean = true;
    constructor(width: number, height: number) {
        this.container = new Container({ width, height });
        this.renderTexture = RenderTexture.create({ width, height, antialias: false, scaleMode: 'nearest' });
        this.sprite = new Sprite();
        this.sprite.texture = this.renderTexture;
        this.sprite.scale.set(4);
        let graphics = new Graphics;
        graphics.circle(200, 50, 10);
        graphics.fill(0xff0000);
        this.container.addChild(graphics);
    }

    render() {
        if (this.worldSpace) {
            this.container.position.set(game.camera.pixelOffset.x, game.camera.pixelOffset.y);
            this.sprite.position.set(game.camera.offsetRemainder.x * 4, game.camera.offsetRemainder.y * 4);
        }

        game.app.renderer.render({ container: this.container, target: this.renderTexture });
        this.renderTexture.update();
    }
}