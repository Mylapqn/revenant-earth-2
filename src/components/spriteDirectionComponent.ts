import { Component } from "../hierarchy/component";
import { Entity } from "../hierarchy/entity";

export class SpriteDirectionComponent extends Component {
    static componentType = "SpriteDirectionComponent";
    direction: number = 0;
    constructor(entity: Entity, id: number) {
        super(entity, id);
        this.entity.on("update", (dt) => this.update(dt));
    }

    update(dt: number) {
        this.direction = this.transform.velocity.x > 0 ? 1 : -1;
    }
}