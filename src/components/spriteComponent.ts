import { Assets, Sprite, Texture } from "pixi.js";
import { Component, ComponentData } from "../hierarchy/component";
import { Entity } from "../hierarchy/entity";
import { TransformableEntity } from "./transfrom";
import { game } from "../game";



export class BasicSprite extends Component {
    static componentType = "BasicSprite";
    override parent: TransformableEntity;
    sprite!: Sprite;
    asset!: string;

    constructor(parent: Entity, id: number) {
        super(parent, id);
        this.parent = parent as TransformableEntity;
    }

    override toData(): ComponentData {
        const data = { asset: this.asset }
        const out = super.toData();
        out.data = data;
        return out;
    }

    override applyData(data: { asset: string }): void {
        this.asset = data.asset;
        this.sprite = new Sprite(Texture.EMPTY);
        game.pixelLayer.container.addChild(this.sprite);
        this.sprite.anchor.set(0.5);
        Assets.load(data.asset).then((texture) => {
            this.sprite.texture = texture;
            this.sprite.texture.source.scaleMode = 'nearest';
        });
    }

    override init(): void {
        this.parent.on("draw", (dt) => this.draw(dt));
    }

    draw(dt: number) {
        this.sprite.position.set(this.parent.position.x, this.parent.position.y);
    }

}