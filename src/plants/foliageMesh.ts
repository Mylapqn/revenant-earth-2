import vert from "../shaders/vert.vert?raw";
import foliageFrag from "../shaders/foliage.frag?raw";
import { Texture } from "pixi.js";
import { ShaderMesh } from "../shaders/shaderMesh";


export class FoliageMesh extends ShaderMesh {
    constructor(texture: Texture) {
        super(texture, vert, foliageFrag);
    }
    resize(width: number, height: number, anchorX: number = .5, anchorY: number = 1) {
        super.resize(width, height, anchorX, anchorY);
    }
}


