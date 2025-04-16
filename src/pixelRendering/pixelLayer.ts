import { Container, Graphics, RenderTexture, Sprite, Texture } from "pixi.js";
import { Game, game } from "../game";
import { PixelSprite } from "./pixelSprite";

export type PixelLayerOptions = ({
    autoResize: true;
} | {
    width: number;
    height: number;
    autoResize?: false;
}) & {
    worldSpace?: boolean;
    depth?: number;
    parent?: Container;
    autoRender?: boolean;
}

export class PixelLayer {
    container: Container;
    renderTexture: RenderTexture;
    sprite: Sprite;
    worldSpace: boolean;
    autoResize: boolean;
    autoRender: boolean;
    depth: number = 1;
    onResize?: (width: number, height: number) => void;
    initialResolution: { x: number, y: number };
    constructor(options: PixelLayerOptions) {
        let width, height;
        if (options.autoResize) {
            width = game.camera.pixelScreen.x+2;
            height = game.camera.pixelScreen.y+2;
            this.autoResize = true;
            this.worldSpace = false;
        }
        else {
            width = options.width;
            height = options.height;
            this.autoResize = false;
        }
        this.worldSpace = options.worldSpace ?? true;
        this.container = new Container();
        this.renderTexture = RenderTexture.create({ width, height, antialias: false, scaleMode: 'nearest' });
        this.sprite = new Sprite();
        this.sprite.texture = this.renderTexture;
        this.sprite.scale.set(Game.pixelScale);
        this.depth = options.depth ?? 1;
        this.autoRender = options.autoRender ?? true;
        this.initialResolution = { x: width, y: height };
        if (options.parent) {
            options.parent.addChild(this.sprite);
        }
        if (this.autoResize) {
            PixelLayer.resizeLayers.add(this);
        }
        if (this.autoRender) {
            PixelLayer.renderLayers.add(this);
        }
    }

    render() {
        if (this.worldSpace) {
            const offsets = game.camera.getPixelOffset(this.depth);
            if (this.autoResize) {
                offsets.offset.x += 1;
                offsets.offset.y += 1;
                offsets.remainder.x -= 1;
                offsets.remainder.y -= 1;
            }
            this.container.position.set(offsets.offset.x, offsets.offset.y);
            this.sprite.position.set(offsets.remainder.x * Game.pixelScale, offsets.remainder.y * Game.pixelScale);
        }

        game.app.renderer.render({ container: this.container, target: this.renderTexture });
        this.renderTexture.update();
    }
    resize(width: number, height: number) {
        if(this.autoResize){
            width+=2;
            height+=2;
            //TODO WHY THE FUCK DO I HAVE TO DO THIS????
            this.sprite.width = Math.floor(Game.pixelScale * width * width / this.initialResolution.x);
            this.sprite.height = Math.floor(Game.pixelScale * height * height / this.initialResolution.y);
        }



        this.renderTexture.resize(width, height);
        if (this.onResize) {
            this.onResize(width, height);
        }
    }
    addChild(child: Container) {
        this.container.addChild(child);
    }

    static resizeLayers = new Set<PixelLayer>();
    static renderLayers = new Set<PixelLayer>();
}