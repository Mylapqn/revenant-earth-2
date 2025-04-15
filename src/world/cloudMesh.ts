import vert from "../shaders/vert.vert?raw";
import cloudFrag from "../shaders/clouds.frag?raw";
import { Texture } from "pixi.js";
import { ShaderMesh } from "../shaders/shaderMesh";
import { game } from "../game";


export class CloudMesh extends ShaderMesh {
    constructor(texture: Texture) {
        super(texture, vert, cloudFrag, {uClouds:{type:"f32",value:0}});
        this.resize(game.camera.pixelScreen.x, game.camera.pixelScreen.y);
    }
}


