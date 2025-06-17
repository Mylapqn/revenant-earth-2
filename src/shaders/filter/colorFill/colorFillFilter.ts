import { defaultFilterVert, Filter, GlProgram } from "pixi.js";
import frag from "./colorFillFilter.frag?raw";
import vert from "../filterVert.vert?raw";
import { CustomColor } from "../../../utils/color";

export class ColorFillFilter extends Filter {
    public color: CustomColor;
    constructor(color: CustomColor = CustomColor.white()) {
        super({
            glProgram: GlProgram.from({ fragment: frag, vertex: vert }),
            resources: {
                group: {
                    uColor: {
                        type: "vec3<f32>",
                        value: color.toShader()
                    }
                }
            }
        });
        this.color = color;
    }
}