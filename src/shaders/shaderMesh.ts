import { Mesh, Texture, MeshGeometry, GlProgram, Sprite, Geometry } from "pixi.js";
import { game } from "../game";
import { TimedShader } from "./timedShader";

const array = [
    0, 0,
    0, 1,
    1, 1,
    1, 0];

export type Uniform = { type: string, value: any };
export type Uniforms = { [name: string]: Uniform };
export class ShaderMesh extends Mesh {
    constructor(texture: Texture, vert: string, frag: string, customUniforms: Uniforms = {}) {
        const mesh = new MeshGeometry({
            positions: new Float32Array(array),
            uvs: new Float32Array(array),
        });
        texture.source.scaleMode = "nearest";
        const shader = new TimedShader({
            glProgram: new GlProgram({ vertex: vert, fragment: frag }),
            resources: {
                uSampler: texture.source,
                group: Object.assign({}, customUniforms),
            },
        });

        super({ geometry: mesh, shader: shader as any });
        this.resize(texture.width, texture.height);
        this.scale.set(1);
        //console.log(game.app.renderer.globalUniforms.bindGroup);
    }
    resize(width: number, height: number, anchorX: number = 0, anchorY: number = 0) {
        this.geometry.positions = new Float32Array([
            -width * anchorX, -height * anchorY,
            -width * anchorX, height * (1 - anchorY),
            width * (1 - anchorX), height * (1 - anchorY),
            width * (1 - anchorX), -height * anchorY]);
    }
    setUniform(name: string, value: any) {
        //this.shader!.resources.group.uniform
        //this.shader!.resources.group.uniformStructures[name] = { type: "f32", value };
        this.shader!.resources.group.uniforms[name] = value;
    }
}


