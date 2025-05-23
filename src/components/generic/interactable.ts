import { game } from "../../game";
import { Component } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { BasicSprite } from "./basicSprite";

export class Interactable extends Component {
    static componentType = "Interactable";
    spriteComponent?: BasicSprite;
    highlighted = false;


    constructor(parent: Entity) {
        super(parent);
        this.onEntity("update", (dt) => this.update(dt));
    }

    override init(): void {
        this.spriteComponent = this.entity.getComponent(BasicSprite);
    }

    update(dt: number) {
        let x = Math.abs(game.player.position.x - this.transform.position.x);
        let y = Math.abs(game.player.position.y - this.transform.position.y);
        if (x < 20 && y < 40) {
            if(!this.highlighted){
                this.highlighted = true;
            }
        }
        else {
            if(this.highlighted){
                this.highlighted = false;
            }
        }

        if (this.spriteComponent) {
            if (this.highlighted) {
                this.spriteComponent.sprite.tint = 0x00ffff;
            }
            else {
                this.spriteComponent.sprite.tint = 0xffffff;
            }
        }
        if (this.highlighted && game.input.keyDown("f")) {
            //game.keys["f"] = false; //FOR TESTING ONLY
            this.entity.emit("interact");
        }
    }

}