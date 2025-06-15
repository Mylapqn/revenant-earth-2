import { BlurFilter, Bounds, ColorMatrixFilter, Container, FilterEffect, Graphics, Matrix, Rectangle, RenderTexture, Sprite, Texture } from "pixi.js";
import { game } from "../game";
import { Vectorlike } from "../utils/vector";

export class BuildingGhost {
    sprite: Sprite;
    container: Container;
    graphics: Graphics;
    visible = false;
    _renderTexture: RenderTexture;
    valid = 0;
    snap?: Vectorlike = undefined;
    onPlace = () => { };
    constructor() {
        this.container = new Container({ parent: game.worldUiContainer });
        this.container.blendMode
        this.graphics = new Graphics();
        this._renderTexture = RenderTexture.create({ width: 32, height: 32, antialias: false, scaleMode: 'nearest' });
        this.sprite = new Sprite({ parent: this.container, anchor: { x: .5, y: .5 } });
        this.sprite.texture = this._renderTexture;
        this.container.alpha = .7;
        this.container.tint = 0xff0000;
        this.setEnabled(false);
    }
    setEnabled(enabled: boolean) {
        this.visible = enabled;
        this.container.visible = enabled;
        if (!enabled) this.graphics.clear();
    }
    update() {
        if (this.visible) {
            if (this.snap) {
                this.container.position.set(this.snap.x, this.snap.y);
                this.snap = undefined;
            }
            else {
                this.container.position.set(Math.floor(game.worldMouse.x), Math.floor(game.worldMouse.y));
            }
            if(this.valid == 0) this.container.tint = 0xff0000;
            if(this.valid == 1) this.container.tint = 0xff9900;
            if(this.valid == 2) this.container.tint = 0x00ff00;
        }
    }
    renderContainer(container: Container) {
        const bounds = container.getLocalBounds();
        bounds.width = Math.floor(bounds.width + 10);
        bounds.height = Math.floor(bounds.height + 10);
        bounds.minX = Math.floor(bounds.minX - 5);
        bounds.minY = Math.floor(bounds.minY - 10);
        container.position.set(-bounds.minX, -bounds.minY);
        this._renderTexture.resize(bounds.width, bounds.height);
        this._renderTexture.update();

        const filter = new ColorMatrixFilter({});
        filter.blackAndWhite(false);
        filter.brightness(2, true);
        container.filters = [filter];
        game.app.renderer.render({ container: container, target: this._renderTexture, clear: true });
        container.filters = [];

        this.setTexture(this._renderTexture, { x: -bounds.minX / bounds.width, y: -bounds.minY / bounds.height });
    }
    renderGraphics() {
        this.renderContainer(this.graphics);
    }
    renderImage(texture: Texture) {
        texture.source.scaleMode = 'nearest';
        const sprite = new Sprite({ texture, roundPixels: true });
        sprite.anchor.set(.5, 1);
        this.renderContainer(sprite);
    }
    setTexture(texture: Texture, anchor?: Vectorlike) {
        anchor = anchor ?? { x: .5, y: .5 };
        this.sprite.destroy();
        this.sprite = new Sprite({ parent: this.container, anchor });
        this.sprite.texture = texture;
    }
}