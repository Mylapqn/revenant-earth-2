import { Assets, Container, RenderTexture, Sprite, Texture } from "pixi.js";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { Game, game } from "../../game";
import { SpriteDirection } from "./spriteDirection";
import { EntityTooltip } from "./entityTooltip";
import { ShaderMesh } from "../../shaders/shaderMesh";
import foliageFrag from "../../shaders/foliage.frag?raw";
import { Vector } from "../../utils/vector";



export class ShaderMeshRenderer extends Component {
    static componentType = "ShaderMesh";
    topContainer: Container;
    container: Container;
    renderMesh: ShaderMesh;
    renderTexture: RenderTexture;
    directionComponent?: SpriteDirection;

    constructor(parent: Entity) {
        super(parent);
        this.container = new Container();
        this.topContainer = new Container();
        //this.topContainer.addChild(this.container);
        //this.container.scale.set(Game.pixelScale);
        this.container.position.set(0,0);
        this.renderTexture = RenderTexture.create({ width: 32, height: 32, antialias: false, scaleMode: 'nearest' });
        this.renderMesh = new ShaderMesh({texture:this.renderTexture,frag:foliageFrag,anchor:new Vector(.5,1)});
        game.foliageContainer.addChild(this.renderMesh);
    }

    override remove() {
        this.renderMesh.destroy();
        this.container.destroy();
        this.renderTexture.destroy();
        super.remove();
    }

    override init(): void {
        this.directionComponent = this.entity.getComponent(SpriteDirection);
    }

    //Doesn't draw automatically, expensive
    draw() {
        const bounds = this.container.getLocalBounds();
        bounds.minX -= 10;
        bounds.maxX += 10;
        bounds.width = bounds.maxX - bounds.minX;
        this.renderTexture.resize(bounds.width, bounds.height);
        if(this.container.position == null){
            console.error("Shadermesh has been removed but is updating!");
            //return;
        }
        this.container.position.set(-bounds.minX,bounds.height);
        this.renderMesh.anchor.x = -bounds.minX/bounds.width;
        this.renderMesh.resize(bounds.width, bounds.height);
        game.app.renderer.render({ container: this.container, target: this.renderTexture });
        if (this.directionComponent != undefined) this.renderMesh.scale.x = this.directionComponent.direction;
        this.renderMesh.position.set(this.transform.position.x, this.transform.position.y);
    }
}