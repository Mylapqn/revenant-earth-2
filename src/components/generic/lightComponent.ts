import { Entity } from "../../hierarchy/entity";
import { ShaderMeshRenderer } from "./shaderMeshRenderer";
import windowFrag from "../../shaders/window.frag?raw";
import { Assets, Container, RenderTexture, Texture } from "pixi.js";
import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { ShaderMesh } from "../../shaders/shaderMesh";
import { Vector, Vectorlike } from "../../utils/vector";
import { SpriteDirection } from "./spriteDirection";
import { Lightmap } from "../../shaders/lighting/lightmap";
import { Light, LightOptions } from "../../shaders/lighting/light";
import { CustomColor } from "../../utils/color";

export class LightComponent extends Component {
    static componentType = "LightComponent";
    light!: Light;
    offset!: Vector;
    directionComponent?: SpriteDirection;

    constructor(parent: Entity) {
        super(parent);
        this.onEntity("draw", (dt) => this.draw(dt));

    }

    override remove() {
        this.light.remove();
        super.remove();
    }

    override init(): void {
        this.directionComponent = this.entity.getComponent(SpriteDirection);
    }
    override toData(): ComponentData {
        const lightData = {
            position: this.offset.toLike(),
            angle: this.light.angle,
            width: this.light.width,
            color: this.light.color.toShader(),
            range: this.light.range,
            intensity: this.light.intensity
        }
        const data = { lightData }
        return super.toData(data);
    }
    override applyData(data: { lightData: any }): void {
        const options: LightOptions = {
            position: new Vector(),
            angle: data.lightData.angle,
            width: data.lightData.width,
            color: CustomColor.fromShader(data.lightData.color),
            range: data.lightData.range,
            intensity: data.lightData.intensity
        };
        this.offset = Vector.fromLike(data.lightData.position);
        this.light = new Light(options);
    }
    draw(dt: number) {
        this.light.position = this.transform.position.clone().add(this.offset);
        //TODO Emissive texture?
        //game.app.renderer.render({ container: this.renderMesh,target:Lightmap.texture,clear:false,transform:this.renderMesh.worldTransform });
    }
}