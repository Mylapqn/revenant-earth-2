import { game } from "../../game";
import { Component } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { BasicSprite } from "./BasicSprite";

export class Interactable extends Component {
    static componentType = "Interactable";
    spriteComponent?: BasicSprite;
    highlighted = false;

    constructor(parent: Entity, id: number) {
        super(parent, id);
        parent.on("update", (dt) => this.update(dt));
    }

    override init(): void {
        this.spriteComponent = this.entity.getComponent(BasicSprite);
    }

    update(dt: number) {
        let x = Math.abs(game.player.position.x - this.transform.position.x);
        let y = Math.abs(game.player.position.y - this.transform.position.y);
        if (x < 20 && y < 40) {
            this.highlighted = true;
        }
        else {
            this.highlighted = false;
        }

        if (this.spriteComponent) {
            if (this.highlighted) {
                this.spriteComponent.sprite.tint = 0x00ffff;
            }
            else {
                this.spriteComponent.sprite.tint = 0xffffff;
            }
        }
        if (this.highlighted && game.keys["f"]) {
            game.keys["f"] = false; //FOR TESTING ONLY
            this.entity.emit("interact");
        }
    }

}