import { Assets, Sprite, Texture } from "pixi.js";
import { Entity } from "../../hierarchy/entity";
import { game } from "../../game";
import SpriteDirection from "./spriteDirection";
import { Lightmap } from "../../shaders/lighting/lightmap";
import { Component } from "../../hierarchy/component";
import { ComponentData } from "../componentIndex";


declare module "../types" { interface ComponentRegistry { BasicSprite: BasicSprite } }
export default class BasicSprite extends Component {
    static componentType = "BasicSprite";
    sprite!: Sprite;
    asset!: string;
    directionComponent?: SpriteDirection;
    containerName?: string

    constructor(parent: Entity) {
        super(parent);
        this.onEntity("draw", (dt) => this.draw(dt));
    }

    override toData(): ComponentData {
        const data: any = { asset: this.asset };
        if (this.containerName) data.container = this.containerName
        return super.toData(data);
    }

    override applyData(data: { asset: string, container?: string }): void {
        this.containerName = data.container
        this.asset = data.asset;
        this.sprite = new Sprite(Texture.EMPTY);
        let container = game.entityContainer;
        if (this.containerName) {
            if (this.containerName == "bg") container = game.bgContainer;
            if (this.containerName == "light") container = game.foliageContainer;
            if (this.containerName == "ui") container = game.worldUiContainer;
        }
        container.addChild(this.sprite);
        this.sprite.anchor.set(0.5);
        Assets.load(data.asset).then((texture) => {
            if (!this.sprite) return;
            this.sprite.texture = texture;
            this.sprite.texture.source.scaleMode = 'nearest';
        });
    }

    override remove() {
        this.sprite.destroy();
        super.remove();
    }

    override init(): void {
        this.directionComponent = this.entity.getComponent(SpriteDirection);
    }

    draw(dt: number) {
        if (game.camera.inView(this.transform.position, 200)) {
            if (this.directionComponent != undefined) this.sprite.scale.x = this.directionComponent.direction;
            this.sprite.position.set(this.transform.position.x, this.transform.position.y);
            this.sprite.visible = true;
            if (this.containerName == "light") game.app.renderer.render({ container: this.sprite, target: Lightmap.texture, clear: false, transform: this.sprite.worldTransform });
        }
        else {
            this.sprite.visible = false;
        }
    }

}
