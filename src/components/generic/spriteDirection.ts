import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { primitiveObject } from "../../hierarchy/serialise";

declare module "../types" { interface ComponentRegistry { SpriteDirection: SpriteDirection } }
export default class SpriteDirection extends Component {
    static componentType = "SpriteDirection";
    direction: number = 0;
    forceDirection: number = 0;
    lookAtPlayer = false;
    constructor(entity: Entity) {
        super(entity);
        this.onEntity("update", (dt) => this.update(dt));
    }

    applyData(data?: { direction?: number, lookAtPlayer?: boolean }): void {
        if (data) {
            this.lookAtPlayer = data.lookAtPlayer ?? false;
            this.forceDirection = data.direction ?? 0;
        }
    }

    toData(): ComponentData {
        let data: primitiveObject = {};
        if (this.lookAtPlayer) data.lookAtPlayer = this.lookAtPlayer
        if (this.forceDirection != 0) data.direction = this.forceDirection
        console.log(data)
        return super.toData(data);
    }

    update(dt: number) {
        this.direction = this.transform.velocity.x > 0 ? 1 : -1;
        if (this.transform.velocity.x == 0) {
            if (this.lookAtPlayer) this.direction = (game.player.position.x - this.transform.position.x) > 0 ? 1 : -1
            if (this.forceDirection != 0) this.direction = this.forceDirection
        }
    }
}