import { Assets, Container, RenderTexture, Sprite, Texture } from "pixi.js";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { Game, game } from "../../game";
import { SpriteDirectionComponent } from "./spriteDirectionComponent";
import { FoliageMesh } from "../../shaders/foliageMesh";



export class ShaderMeshComponent extends Component {
    static componentType = "ShaderMeshComponent";
    container: Container;
    renderMesh: FoliageMesh;
    renderTexture: RenderTexture;
    directionComponent?: SpriteDirectionComponent;

    constructor(parent: Entity) {
        super(parent);
        this.container = new Container();
        //this.container.scale.set(Game.pixelScale);
        this.container.position.set(100,200);
        this.renderTexture = RenderTexture.create({ width: 32, height: 32, antialias: false, scaleMode: 'nearest' });
        this.renderMesh = new FoliageMesh(this.renderTexture);
    }

    override remove() {
        this.renderMesh.destroy();
        this.container.destroy();
        this.renderTexture.destroy();
        super.remove();
    }

    override init(): void {
        game.pixelLayer.container.addChild(this.renderMesh);
        this.directionComponent = this.entity.getComponent(SpriteDirectionComponent);
    }

    //Doesn't draw automatically, expensive
    draw() {
        let bounds = this.container.getBounds();
        bounds.width += 10;
        bounds.height += 10;
        this.renderTexture.resize(bounds.width, bounds.height);
        this.container.position.set(bounds.width/2,bounds.height);
        this.renderMesh.resize(bounds.width, bounds.height);
        game.app.renderer.render({ container: this.container, target: this.renderTexture });
        if (this.directionComponent != undefined) this.renderMesh.scale.x = this.directionComponent.direction;
        this.renderMesh.position.set(this.transform.position.x, this.transform.position.y);
    }

}