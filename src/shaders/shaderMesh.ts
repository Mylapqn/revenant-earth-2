import { Mesh, Texture, MeshGeometry, GlProgram, DestroyOptions } from "pixi.js";
import { Vector } from "../utils/vector";
import defaultVert from "../shaders/vert.vert?raw";
import defaultFrag from "../shaders/frag.frag?raw";
import { TimedTextureShader } from "./timedShaderTexture";

const array = [
    0, 0,
    0, 1,
    1, 1,
    1, 0];

export type Uniform = { type: string, value: any };
export type Uniforms = { [name: string]: Uniform };
export type ShaderMeshOptions = {
    texture?: Texture,
    customTextures?: { name: string, texture: Texture }[],
    vert?: string,
    frag: string,
    customUniforms?: Uniforms,
    anchor?: Vector,
    size?: Vector
};
export class ShaderMesh extends Mesh {
    public get shader(): TimedTextureShader {
        return super.shader as TimedTextureShader;
    }
    public set shader(value: TimedTextureShader) {
        super.shader = value;
    }
    anchor = new Vector(0, 0);
    set texture(value: Texture) {
        if (this.anchor)
            this.resize(value.width, value.height);
        super.texture = value;
    }
    get texture() { return super.texture; }
    constructor(options: ShaderMeshOptions) {
        const mesh = new MeshGeometry({
            positions: new Float32Array(array),
            uvs: new Float32Array(array),
        });

        const texture = options.texture ?? Texture.WHITE;
        texture.source.scaleMode = "nearest";
        const resources: { [name: string]: any } = {
            uSampler: texture.source,
        };

        if (options.customTextures) {
            for (let i = 0; i < options.customTextures.length; i++) {
                options.customTextures[i].texture.source.scaleMode = "nearest";
                resources[options.customTextures[i].name] = options.customTextures[i].texture.source;
            }
        }
        resources.group = options.customUniforms ? Object.assign({}, options.customUniforms) : {};
        const vertex = options.vert ?? defaultVert;
        const fragment = options.frag ?? defaultFrag;
        const shader = new TimedTextureShader({
            glProgram: GlProgram.from({ vertex, fragment }),
            resources,
        });
        super({ texture, geometry: mesh, shader: shader as any });
        this.anchor = options.anchor ?? new Vector(0, 0);
        this.resize(options.size?.x ?? texture.width, options.size?.y ?? texture.height);
        this.scale.set(1);
        //console.log(game.app.renderer.globalUniforms.bindGroup);
    }
    resize(width: number, height: number) {
        this.geometry.positions = new Float32Array([
            -width * this.anchor.x, -height * this.anchor.y,
            -width * this.anchor.x, height * (1 - this.anchor.y),
            width * (1 - this.anchor.x), height * (1 - this.anchor.y),
            width * (1 - this.anchor.x), -height * this.anchor.y]);
    }
    setUniform(name: string, value: any) {
        //this.shader!.resources.group.uniform
        //this.shader!.resources.group.uniformStructures[name] = { type: "f32", value };
        this.shader!.resources.group.uniforms[name] = value;
    }
    destroy(options?: DestroyOptions): void {
        super.destroy(options);
        this.shader?.destroy();
    }
}


