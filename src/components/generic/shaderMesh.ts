import { Assets, Container, RenderTexture, Sprite, Texture } from "pixi.js";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { Game, game } from "../../game";
import { SpriteDirection } from "./spriteDirection";
import { FoliageMesh } from "../../plants/foliageMesh";
import { EntityTooltip } from "./entityTooltip";



export class ShaderMeshRenderer extends Component {
    static componentType = "ShaderMesh";
    topContainer: Container;
    container: Container;
    renderMesh: FoliageMesh;
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
        this.renderMesh = new FoliageMesh(this.renderTexture);
        game.pixelLayer.container.addChild(this.renderMesh);
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
        this.container.position.set(-bounds.minX,bounds.height);
        this.renderMesh.resize(bounds.width, bounds.height,-bounds.minX/bounds.width);
        game.app.renderer.render({ container: this.container, target: this.renderTexture });
        if (this.directionComponent != undefined) this.renderMesh.scale.x = this.directionComponent.direction;
        this.renderMesh.position.set(this.transform.position.x, this.transform.position.y);
    }

}