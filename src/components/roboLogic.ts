import { game } from "../game";
import { Component } from "../hierarchy/component";
import { Entity } from "../hierarchy/entity";
import { BasicSprite } from "./spriteComponent";
import { TransformableEntity } from "./transfrom";

export class RoboLogic extends Component {
    static componentType = "RoboLogic";
    override parent: TransformableEntity;
    basicSprite!: BasicSprite;


    constructor(parent: Entity, id: number) {
        super(parent, id);
        this.parent = parent as TransformableEntity;
        parent.on("update", (dt) => this.update(dt));
    }

    override init(): void {
        this.basicSprite = this.parent.getComponent(BasicSprite)!;
    }

    update(dt: number) {
        let x = (game.player.position.x - this.parent.position.x) * .01 + this.parent.position.x;
        let y = (game.player.position.y - this.parent.position.y) * .01 + this.parent.position.y;

        this.parent.position.set(x, y);

        const sprite = this.basicSprite.sprite;
        sprite.scale.x = x < sprite.position.x ? -1 : 1;
    }




}