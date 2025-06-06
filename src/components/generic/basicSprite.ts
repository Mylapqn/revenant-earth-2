import { Assets, Sprite, Texture } from "pixi.js";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { game } from "../../game";
import { SpriteDirection } from "./spriteDirection";



export class BasicSprite extends Component {
    static componentType = "BasicSprite";
    sprite!: Sprite;
    asset!: string;
    directionComponent?: SpriteDirection;

    constructor(parent: Entity) {
        super(parent);
        this.onEntity("draw", (dt) => this.draw(dt));
    }

    override toData(): ComponentData {
        const data = { asset: this.asset }
        return super.toData(data);
    }

    override applyData(data: { asset: string }): void {
        this.asset = data.asset;
        this.sprite = new Sprite(Texture.EMPTY);
        game.entityContainer.addChild(this.sprite);
        this.sprite.anchor.set(0.5);
        Assets.load(data.asset).then((texture) => {
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
        if (this.directionComponent != undefined) this.sprite.scale.x = this.directionComponent.direction;
        this.sprite.position.set(this.transform.position.x, this.transform.position.y);
    }

}
