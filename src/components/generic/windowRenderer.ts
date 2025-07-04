import { Entity } from "../../hierarchy/entity";
import windowFrag from "../../shaders/window.frag?raw";
import windowEmissiveFrag from "../../shaders/windowEmissive.frag?raw";
import { Assets, Container, Texture } from "pixi.js";
import { game } from "../../game";
import { ShaderMesh } from "../../shaders/shaderMesh";
import { Vector } from "../../utils/vector";
import SpriteDirection from "./spriteDirection";
import { Lightmap } from "../../shaders/lighting/lightmap";
import { Component } from "../../hierarchy/component";
import { ComponentData } from "../componentIndex";

declare module "../types" { interface ComponentRegistry { WindowRenderer: WindowRenderer } }
export default class WindowRenderer extends Component {
    static componentType = "WindowRenderer";
    topContainer: Container;
    container: Container;
    renderMesh!: ShaderMesh;
    emissiveMesh!: ShaderMesh;
    directionComponent?: SpriteDirection;
    asset!: string;

    constructor(parent: Entity) {
        super(parent);
        this.container = new Container();
        this.topContainer = new Container();
        //this.topContainer.addChild(this.container);
        //this.container.scale.set(Game.pixelScale);

    }

    override remove() {
        this.renderMesh.destroy();
        this.emissiveMesh.destroy();
        this.container.destroy();
        this.topContainer.destroy();
        super.remove();
    }

    override init(): void {
        this.directionComponent = this.entity.getComponent(SpriteDirection);
        //new Light({position:this.transform.position.clone().add({x:0,y:-10}),width:2.5,range:150,angle:Math.PI/2,intensity:1.5});
    }
    override toData(): ComponentData {
        const data = { asset: this.asset }
        return super.toData(data);
    }
    override applyData(data: { asset: string }): void {
        this.asset = data.asset;
        this.container.position.set(0, 0);
        this.onEntity("draw", (dt) => this.draw(dt));
        this.renderMesh = new ShaderMesh({
            texture: Texture.WHITE, frag: windowFrag, anchor: new Vector(.5, .5), customTextures: [{ name: "uBackground", texture: game.ambience.background }],
            customUniforms: {
                uBackgroundResolution: {
                    type: "vec2<f32>",
                    value: [game.ambience.background.width, game.ambience.background.height]
                }
            }
        });
        this.emissiveMesh = new ShaderMesh({
            texture: Texture.WHITE, frag: windowEmissiveFrag, anchor: new Vector(.5, .5),
        });

        Assets.load(data.asset).then((texture) => {
            if (!this.renderMesh || !this.emissiveMesh) return;
            this.renderMesh.texture = texture;
            this.emissiveMesh.texture = texture;
            game.bgContainer.addChild(this.renderMesh);
            this.setBackground(game.ambience.background);
        });
    }
    setBackground(texture: Texture) {

        texture.source.repeatMode = "repeat";
        this.renderMesh.setUniform("uBackgroundResolution", [texture.width, texture.height]);
        //console.log(this.renderMesh.shader!.resources.group.uniforms.uBackgroundResolution);
        //console.log(this.renderMesh.shader!.resources.resolutionGroup.uniforms.uWindowResolution);
    }
    draw(dt: number) {
        if (this.directionComponent != undefined) this.renderMesh.scale.x = this.directionComponent.direction;
        this.renderMesh.position.set(this.transform.position.x, this.transform.position.y);
        game.app.renderer.render({ container: this.emissiveMesh, target: Lightmap.texture, clear: false, transform: this.renderMesh.worldTransform });
    }
}