import { Container, Graphics, Rectangle, RenderTexture, Sprite, Texture } from "pixi.js";
import { Game, game } from "../game";
import { PixelSprite } from "./pixelSprite";
import { TerrainFilter } from "../shaders/terrainFilter";
import { lerp } from "../utils/utils";
import { ShaderMesh } from "../shaders/shaderMesh";
import vertexShaderDefault from "../shaders/vert.vert?raw";
import fragmentShaderBackground from "../shaders/background.frag?raw";
import fragmentShaderDefault from "../shaders/frag.frag?raw";

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
    renderMesh: ShaderMesh;
    worldSpace: boolean;
    autoResize: boolean;
    autoRender: boolean;
    depth: number = 1;
    onResize?: (width: number, height: number) => void;
    initialResolution: { x: number, y: number };
    constructor(options: PixelLayerOptions) {
        let width, height;
        if (options.autoResize) {
            width = game.camera.pixelScreen.x + 2;
            height = game.camera.pixelScreen.y + 2;
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
        this.renderMesh = new ShaderMesh(this.renderTexture, vertexShaderDefault, (this.depth < 1 && this.worldSpace) ? fragmentShaderBackground : fragmentShaderDefault, {
            uDepth: { type: "f32", value: this.depth },
            uPosition: { type: "vec2<f32>", value: new Float32Array([0, 0]) }
        });
        this.renderMesh.scale.set(Game.pixelScale);
        this.initialResolution = { x: width, y: height };
        if (options.parent) {
            options.parent.addChild(this.renderMesh);
        }
        if (this.autoResize) {
            PixelLayer.resizeLayers.add(this);
        }
        if (this.autoRender) {
            PixelLayer.renderLayers.add(this);
        }
        if (this.depth < 1 && this.worldSpace) {
            this.sprite.filters = [new TerrainFilter(this.depth)];
        }
    }

    render() {
        if (this.worldSpace) {
            const offsets = game.camera.getCenteredPixelOffset(this.depth);
            if (this.autoResize) {
                offsets.offset.x -= 1;
                offsets.offset.y -= 1;
                offsets.remainder.x -= 1;
                offsets.remainder.y -= 1;
            }
            this.container.position.set(offsets.offset.x, offsets.offset.y);
            if (this.sprite.filters instanceof Array && this.sprite.filters.length > 0) {
                this.sprite.filters[0].resources.terrainGroup.uniforms.uPosition = [offsets.offset.x / this.sprite.width * Game.pixelScale, offsets.offset.y / this.sprite.height * Game.pixelScale];
            }
            this.renderMesh.setUniform("uPosition", [offsets.offset.x / this.sprite.width * Game.pixelScale, offsets.offset.y / this.sprite.height * Game.pixelScale]);
            //this.shaderMesh.position.set(game.input.mouse.position.x, game.input.mouse.position.y);
            this.renderMesh.position.set(offsets.remainder.x * Game.pixelScale, offsets.remainder.y * Game.pixelScale);
            //console.log(this.sprite.position);
        }
        game.app.renderer.render({ container: this.container, target: this.renderTexture });
        this.renderTexture.update();
        if (this.sprite.filters instanceof Array && this.sprite.filters.length > 0) {
            this.sprite.filters[0].resources.timeGroup.uniforms.uTime = game.elapsedTime;
        }
    }
    resize(width: number, height: number) {
        if (this.autoResize) {
            width += 2;
            height += 2;
            //TODO WHY THE FUCK DO I HAVE TO DO THIS????
            //this.sprite.width = Math.floor(Game.pixelScale * width * width / this.initialResolution.x);
            //this.sprite.height = Math.floor(Game.pixelScale * height * height / this.initialResolution.y);
        }



        this.renderTexture.resize(width, height);
        this.renderMesh.resize(width, height);
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