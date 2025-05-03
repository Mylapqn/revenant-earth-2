import { defaultFilterVert, Filter, GlProgram } from "pixi.js";
import vertex from "./vert.vert?raw";
import fragment from "./background.frag?raw";

export class BackgroundFilter extends Filter {
    constructor(depth: number) {
        super({
            glProgram: BackgroundFilter.program,
            resources: {
                timeGroup: {
                    uTime: { type: "f32", value: 0 }
                },
                randomGroup: {
                    uRandom: { type: "f32", value: Math.random() }
                },
                terrainGroup: {
                    uDepth: { type: "f32", value: depth },
                    uPosition: { type: "vec2<f32>", value: new Float32Array([0, 0]) }
                }
            }
        })
    }
    static program = new GlProgram({
        vertex: defaultFilterVert,
        fragment
    })
}

export class ForegroundFilter extends Filter {
    constructor(depth: number) {
        super({
            glProgram: ForegroundFilter.program,
            resources: {
                timeGroup: {
                    uTime: { type: "f32", value: 0 }
                },
                randomGroup: {
                    uRandom: { type: "f32", value: Math.random() }
                },
                terrainGroup: {
                    uDepth: { type: "f32", value: depth },
                    uPosition: { type: "vec2<f32>", value: new Float32Array([0, 0]) }
                }
            }
        })
    }
    static program = new GlProgram({
        vertex: defaultFilterVert,
        fragment
    })
}