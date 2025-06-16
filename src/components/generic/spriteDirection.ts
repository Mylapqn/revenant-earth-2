import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { primitiveObject } from "../../hierarchy/serialise";

export class SpriteDirection extends Component {
    static componentType = "SpriteDirection";
    direction: number = 0;
    forceDirection:number = 0;
    constructor(entity: Entity) {
        super(entity);
        this.onEntity("update", (dt) => this.update(dt));
    }

    applyData(data?: { direction?: number }): void {
        if (data) {
            this.forceDirection = data.direction ?? 0;
        }
    }

    toData(data?: primitiveObject): ComponentData {
        data = { direction: this.direction };
        return super.toData(data);
    }

    update(dt: number) {
        this.direction = this.transform.velocity.x > 0 ? 1 : -1;
        if(this.forceDirection != 0 && this.transform.velocity.x == 0) this.direction = this.forceDirection;
    }
}