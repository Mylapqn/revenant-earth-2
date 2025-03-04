import { game } from "../../game";
import { Component } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { BasicSprite } from "./BasicSprite";

export class RoboLogic extends Component {
    static componentType = "RoboLogic";

    constructor(parent: Entity, id: number) {
        super(parent, id);
        this.onEntity("update", (dt) => this.update(dt));
    }

    override init(): void {
    }

    update(dt: number) {
        let x = (game.player.position.x - this.transform.position.x) * 1;
        let y = (game.player.position.y - this.transform.position.y) * 1;

        this.transform.velocity.set(x, y);
    }

}