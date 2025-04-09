import { Shader, ShaderWithResources } from "pixi.js";

export class TimedShader extends Shader {
    constructor(options: ShaderWithResources) {
        if (!options.resources) options.resources = {};
        options.resources.timeGroup = { uTime: { type: "f32", value: 0 } };
        super(options);
        TimedShader.list.push(this);
    }
    static list: TimedShader[] = [];
    static update(sceneTime: number) {
        for (const shader of TimedShader.list) {
            //console.log(shader.resources.timeGroup);
            shader.resources.timeGroup.uniforms.uTime = sceneTime;
        }
    }
}
