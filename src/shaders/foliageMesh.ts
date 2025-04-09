import vert from "./vert.vert?raw";
import foliageFrag from "./foliage.frag?raw";
import { Mesh, Texture, MeshGeometry, GlProgram, Sprite, Geometry } from "pixi.js";
import { game } from "../game";
import { TimedShader } from "./timedShader";

const array = [
    0, 0,
    0, 1,
    1, 1,
    1, 0];
export class FoliageMesh extends Mesh {
    constructor(texture: Texture) {
        const mesh = new MeshGeometry({
            positions: new Float32Array(array),
            uvs: new Float32Array(array),
        });
        texture.source.scaleMode = "nearest";
        const shader = new TimedShader({
            glProgram: new GlProgram({ vertex: vert, fragment: foliageFrag }),
            resources: {
                uSampler: texture.source,
            },
        });

        super({ geometry: mesh, shader: shader as any });
        this.geometry.positions = new Float32Array([
            0, 0,
            0, texture.height,
            texture.width, texture.height,
            texture.width, 0]);
        this.scale.set(1);
        //console.log(game.app.renderer.globalUniforms.bindGroup);
    }
}


