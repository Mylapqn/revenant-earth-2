import { Shader, ShaderWithResources, Texture, TextureShader } from "pixi.js";
import { game } from "../game";

export class TimedShader extends Shader {
    enabled = true;
    constructor(options: ShaderWithResources) {
        if (!options.resources) options.resources = {};
        options.resources.timeGroup = { uTime: { type: "f32", value: 0 } };
        options.resources.randomGroup = { uRandom: { type: "f32", value: Math.random() } };
        options.resources.resolutionGroup = { uWindowResolution: { type: "vec2<f32>", value: new Float32Array([game.camera.pixelScreen.x, game.camera.pixelScreen.y]) } };
        super(options);
        TimedShader.list.push(this);
    }
    static list: TimedShader[] = [];
    static update(sceneTime: number) {
        for (const shader of TimedShader.list) {
            if(!shader.enabled) continue;
            //console.log(shader.resources.timeGroup);
            shader.resources.timeGroup.uniforms.uTime = sceneTime;
            shader.resources.resolutionGroup.uniforms.uWindowResolution = [game.camera.pixelScreen.x, game.camera.pixelScreen.y];
        }
    }
    destroy() {
        TimedShader.list.splice(TimedShader.list.indexOf(this), 1);
        super.destroy();
    }
}
