import { CLEAR, Container, Graphics, RenderTexture, Sprite, Texture } from "pixi.js";
import { Game, game } from "../game";
import { ShaderMesh, Uniforms } from "../shaders/shaderMesh";
import fragmentShaderBackground from "../shaders/terrain/background.frag?raw";
import fragmentShaderForeground from "../shaders/terrain/foreground.frag?raw";
import fragmentShaderDefault from "../shaders/frag.frag?raw";
import fragmentShaderMain from "../shaders/terrain/mainLayer.frag?raw";
import { CustomColor } from "../utils/color";
import { Lightmap } from "../shaders/lighting/lightmap";
import { Debug } from "../dev/debug";
import { Vector, Vectorlike } from "../utils/vector";
import { MouseButton } from "../input";
import { Light } from "../shaders/lighting/light";
import { Shadowmap } from "../shaders/lighting/shadowmap";

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
    lighting?: boolean;
}

export class PixelLayer {
    container: Container;
    renderTexture: RenderTexture;
    displayTexture: RenderTexture;
    renderMesh: ShaderMesh;
    displayMesh: ShaderMesh;
    worldSpace: boolean;
    autoResize: boolean;
    autoRender: boolean;
    depth: number = 1;
    lighting: boolean = true;
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
        this.lighting = options.lighting ?? true;
        this.worldSpace = options.worldSpace ?? true;
        this.container = new Container();
        this.renderTexture = RenderTexture.create({ width, height, antialias: false, scaleMode: 'nearest' });
        this.displayTexture = RenderTexture.create({ width, height, antialias: false, scaleMode: 'nearest' });
        this.depth = options.depth ?? 1;
        this.autoRender = options.autoRender ?? true;
        let fragmentShader = fragmentShaderDefault;
        let customTextures = [];
        let uniforms: Uniforms = {
            uDepth: { type: "f32", value: this.depth },
            uPosition: { type: "vec2<f32>", value: new Float32Array([0, 0]) },
            uRemainder: { type: "vec2<f32>", value: new Float32Array([0, 0]) },
            uResolution: { type: "vec2<f32>", value: new Float32Array([0, 0]) },
            uAmbient: { type: "vec3<f32>", value: new Float32Array([0, 0, 0]) }
        };
        if (this.worldSpace) {
            if (this.depth < 1) {
                fragmentShader = fragmentShaderBackground;
                uniforms.uGroundFogColor = { type: "vec3<f32>", value: new Float32Array([0, 0, 0]) };
                uniforms.uDistanceFogColor = { type: "vec3<f32>", value: new Float32Array([0, 0, 0]) };
            }
            else if (this.depth > 1) {
                fragmentShader = fragmentShaderForeground;
                uniforms.uPlayerPosition = { type: "vec2<f32>", value: new Float32Array([0, 0]) };
            }
            else if (this.depth === 1 && this.autoResize && this.lighting) {
                fragmentShader = fragmentShaderMain;
                customTextures.push({ name: "uLightMap", texture: Lightmap.texture });
            }
            else if (this.depth === 1) {
                fragmentShader = fragmentShaderDefault;
            }
        }
        this.renderMesh = new ShaderMesh({ texture: this.renderTexture, frag: fragmentShader, customUniforms: uniforms, customTextures: customTextures });
        this.renderMesh.scale.set(1);
        this.displayMesh = new ShaderMesh({ texture: this.displayTexture, frag: fragmentShaderDefault });
        this.displayMesh.scale.set(Game.pixelScale);
        this.initialResolution = { x: width, y: height };
        if (options.parent) {
            options.parent.addChild(this.displayMesh);
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
                offsets.offset.x += 1;
                offsets.offset.y += 1;
                offsets.remainder.x -= 1;
                offsets.remainder.y -= 1;
            }
            let deltaPixel = Vector.fromLike(offsets.offset).sub(this.container.position.clone()).mult(-1);
            this.container.position.set(offsets.offset.x, offsets.offset.y);
            this.displayMesh.position.set(offsets.remainder.x * Game.pixelScale, offsets.remainder.y * Game.pixelScale);
            //if (game.input.mouse.getButton(MouseButton.Right)) delta.set({ x: 0, y: 0 });
            //Debug.log(delta.x);
            this.renderMesh.setUniform("uPosition", [offsets.offset.x / this.renderTexture.width, offsets.offset.y / this.renderTexture.height]);
            this.renderMesh.setUniform("uRemainder", [deltaPixel.x / this.renderTexture.width, deltaPixel.y / this.renderTexture.height]);
            //this.renderMesh.setUniform("uRemainder", [0,0]);
            this.renderMesh.setUniform("uAmbient", game.ambience.ambientColor().toShader());
            if (this.depth > 1) this.renderMesh.setUniform("uPlayerPosition", game.camera.worldToRender(game.player.position).xy());
            if (this.depth < 1) {
                this.renderMesh.setUniform("uDistanceFogColor", game.ambience.fogColor().distance);
                this.renderMesh.setUniform("uGroundFogColor", game.ambience.fogColor().ground);
            }
            //this.shaderMesh.position.set(game.input.mouse.position.x, game.input.mouse.position.y);
            //console.log(this.sprite.position);
        }
        if (this.depth === 1 && this.worldSpace && this.autoResize && this.lighting) {
            let col = CustomColor.fromShader(game.ambience.data.ambientColor);
            col = col.mix(new CustomColor(40, 20, 0), game.input.mouse.position.y / game.app.renderer.screen.height);
            this.renderMesh.setUniform("uAmbient", game.ambience.ambientColor().toShader());
        }


        //TODO pixelLayer final stage is rendered in full resolution but it should be in pixel scale
        game.app.renderer.render({ container: this.container, target: this.renderTexture });
        game.app.renderer.render({ container: this.renderMesh, target: this.displayTexture });
    }
    resize(width: number, height: number) {
        if (this.autoResize) {
            width += 2;
            height += 2;
        }
        this.renderMesh.setUniform("uResolution", [width, height]);
        this.renderTexture.resize(width, height);
        this.renderMesh.resize(width, height);
        this.displayTexture.resize(width, height);
        this.displayMesh.resize(width, height);
        if (this.onResize) {
            this.onResize(width, height);
        }
    }
    addChild(child: Container) {
        this.container.addChild(child);
    }
    randomTerrain(startY?: number) {
        const bgg = new Graphics({ parent: this.container });
        let y = startY ?? 0;
        bgg.moveTo(0, 1000);
        bgg.lineTo(0, y);
        const width = 200 + 1800 * this.depth;
        for (let t = 0; t < width; t++) {
            y += (Math.random() - .5) * 5;
            bgg.lineTo(t * 5, y);
        }
        bgg.lineTo(width * 5, 1000);
        bgg.fill(CustomColor.gray(255 * (1.2 - this.depth)));
    }
    randomTerrainWithSprites(textures: Set<Texture>, startY?: number) {
        const bgg = new Graphics({ parent: this.container });
        let y = startY ?? 0;
        bgg.moveTo(0, 1000);
        bgg.lineTo(0, y);
        const width = 200 + 1800 * this.depth;
        let nextSprite = 0;
        for (let t = 0; t < width; t++) {
            y += (Math.random() - .5) * 5;
            if (t > nextSprite) {
                const sprite = new Sprite({ texture: Array.from(textures)[Math.floor(Math.random() * textures.size)], anchor: { x: 0, y: 1 } });
                nextSprite = t + Math.random() * 20 + sprite.texture.width / 5;
                sprite.position.set(t * 5, Math.floor(y + 10));
                this.container.addChild(sprite);
            }
            bgg.lineTo(t * 5, y);
        }
        bgg.lineTo(width * 5, 1000);
        bgg.fill(CustomColor.gray(255 * (1.2 - this.depth)));
    }

    static resizeLayers = new Set<PixelLayer>();
    static renderLayers = new Set<PixelLayer>();
}