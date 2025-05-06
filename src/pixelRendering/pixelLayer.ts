import { CLEAR, Container, Graphics, RenderTexture, Sprite } from "pixi.js";
import { Game, game } from "../game";
import { ShaderMesh, Uniforms } from "../shaders/shaderMesh";
import fragmentShaderBackground from "../shaders/background.frag?raw";
import fragmentShaderForeground from "../shaders/foreground.frag?raw";
import fragmentShaderDefault from "../shaders/frag.frag?raw";
import fragmentShaderMain from "../shaders/mainLayer.frag?raw";
import { CustomColor } from "../utils/color";
import { Lightmap } from "../shaders/lighting/lightmap";

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
        this.depth = options.depth ?? 1;
        this.autoRender = options.autoRender ?? true;
        let fragmentShader = fragmentShaderDefault;
        let customTextures = [];
        let uniforms: Uniforms = {
            uDepth: { type: "f32", value: this.depth },
            uPosition: { type: "vec2<f32>", value: new Float32Array([0, 0]) },
            uResolution: { type: "vec2<f32>", value: new Float32Array([0, 0]) }
        };
        if (this.depth < 1 && this.worldSpace) {
            fragmentShader = fragmentShaderBackground;
        }
        else if (this.depth > 1 && this.worldSpace) {
            fragmentShader = fragmentShaderForeground;
            uniforms.uPlayerPosition = { type: "vec2<f32>", value: new Float32Array([0, 0]) };
        }
        else if (this.depth === 1 && this.worldSpace && this.autoResize) {
            fragmentShader = fragmentShaderMain;
            customTextures.push({ name: "uLightMap", texture: Lightmap.texture });
        }
        this.renderMesh = new ShaderMesh({ texture: this.renderTexture, frag: fragmentShader, customUniforms: uniforms, customTextures: customTextures });
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
        this.resize(width, height);
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
            this.renderMesh.setUniform("uPosition", [offsets.offset.x / this.renderTexture.width * Game.pixelScale, offsets.offset.y / this.renderTexture.height * Game.pixelScale]);
            if (this.depth > 1) this.renderMesh.setUniform("uPlayerPosition", game.camera.worldToRender(game.player.position).xy());
            //this.shaderMesh.position.set(game.input.mouse.position.x, game.input.mouse.position.y);
            this.renderMesh.position.set(offsets.remainder.x * Game.pixelScale, offsets.remainder.y * Game.pixelScale);
            //console.log(this.sprite.position);
        }

        //TODO pixelLayer final stage is rendered in full resolution but it should be in pixel scale
        game.app.renderer.render({ container: this.container, target: this.renderTexture });
        this.renderTexture.update();
    }
    resize(width: number, height: number) {
        if (this.autoResize) {
            width += 2;
            height += 2;
            //TODO WHY THE FUCK DO I HAVE TO DO THIS????
            //this.sprite.width = Math.floor(Game.pixelScale * width * width / this.initialResolution.x);
            //this.sprite.height = Math.floor(Game.pixelScale * height * height / this.initialResolution.y);
        }
        this.renderMesh.setUniform("uResolution", [width, height]);
        this.renderTexture.resize(width, height);
        this.renderMesh.resize(width, height);
        if (this.onResize) {
            this.onResize(width, height);
        }
    }
    addChild(child: Container) {
        this.container.addChild(child);
    }
    randomTerrain() {
        const bgg = new Graphics({ parent: this.container });
        let y = 0;
        bgg.moveTo(0, 1000);
        bgg.lineTo(0, y);
        const width = 180 + 400 * this.depth;
        for (let t = 0; t < width; t++) {
            y += (Math.random() - .5) * 5;
            bgg.lineTo(t * 5, y);
        }
        bgg.lineTo(width * 5, 1000);
        bgg.fill(CustomColor.gray(255 * (1.2 - this.depth)));
    }

    static resizeLayers = new Set<PixelLayer>();
    static renderLayers = new Set<PixelLayer>();
}