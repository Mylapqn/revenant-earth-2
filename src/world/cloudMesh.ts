import vert from "../shaders/vert.vert?raw";
import cloudFrag from "../shaders/terrain/clouds.frag?raw";
import { Texture } from "pixi.js";
import { ShaderMesh } from "../shaders/shaderMesh";
import { game } from "../game";


export class CloudMesh extends ShaderMesh {
    constructor(texture: Texture) {
        //use options
        super({
            texture: texture, frag: cloudFrag, customUniforms: {
                uClouds: { type: "f32", value: 0 },
                uSunPosition: { type: "vec2<f32>", value: new Float32Array([0, 0]) },
                uResolution: { type: "vec2<f32>", value: new Float32Array([0, 0]) },
                uAmbient: { type: "vec3<f32>", value: new Float32Array([0, 0, 0]) },
                uDistanceFogColor: { type: "vec3<f32>", value: new Float32Array([0, 0, 0]) },
                uGroundFogColor: { type: "vec3<f32>", value: new Float32Array([0, 0, 0]) },
                uCloudColor: { type: "vec3<f32>", value: new Float32Array([0, 0, 0]) },
            }
        });
        this.resize(game.camera.pixelScreen.x, game.camera.pixelScreen.y);
    }
}


