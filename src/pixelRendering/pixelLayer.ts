import { Container, Graphics, RenderTexture, Sprite } from "pixi.js";
import { Game, game } from "../game";
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
        this.sprite.scale.set(Game.pixelScale);
        let graphics = new Graphics;
        graphics.circle(200, 50, 10);
        graphics.fill(0xff0000);
        this.container.addChild(graphics);
    }

    render() {
        if (this.worldSpace) {
            this.container.position.set(game.camera.pixelOffset.x, game.camera.pixelOffset.y);
            this.sprite.position.set(game.camera.offsetRemainder.x * Game.pixelScale, game.camera.offsetRemainder.y * Game.pixelScale);
        }

        game.app.renderer.render({ container: this.container, target: this.renderTexture });
        this.renderTexture.update();
    }
}