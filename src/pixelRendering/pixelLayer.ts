import { Container, Graphics, RenderTexture, Sprite } from "pixi.js";
import { Game, game } from "../game";
import { PixelSprite } from "./pixelSprite";

export class PixelLayer {
    container: Container;
    renderTexture: RenderTexture;
    sprite: Sprite;
    worldSpace: boolean = true;
    depth: number = 1;
    constructor(width: number, height: number, depth: number = 1) {
        this.container = new Container({ width, height });
        this.renderTexture = RenderTexture.create({ width, height, antialias: false, scaleMode: 'nearest' });
        this.sprite = new Sprite();
        this.sprite.texture = this.renderTexture;
        this.sprite.scale.set(Game.pixelScale);
        this.depth = depth;
    }

    render() {
        if (this.worldSpace) {
            const offsets = game.camera.getPixelOffset(this.depth);
            this.container.position.set(offsets.offset.x, offsets.offset.y);
            this.sprite.position.set(offsets.remainder.x * Game.pixelScale, offsets.remainder.y * Game.pixelScale);
        }

        game.app.renderer.render({ container: this.container, target: this.renderTexture });
        this.renderTexture.update();
    }
    addChild(child: Container) {
        this.container.addChild(child);
    }
}