import { game } from "../../game";
import { Component } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { MouseButton } from "../../input";
import { BasicSprite } from "./basicSprite";
import { Interactable } from "./interactable";
import { ShaderMesh } from "./shaderMesh";

export class EntityTooltip extends Component {
    static componentType = "EntityTooltip";
    interactableComponent?: Interactable;
    spriteComponent?: BasicSprite;
    shaderMeshComponent?: ShaderMesh;
    highlighted = false;
    tooltipData = new Map<string, string>();
    tooltipName = "entity name";

    constructor(parent: Entity) {
        super(parent);
        this.onEntity("update", (dt) => this.update(dt));
        this.onEntity("hoverOn", () => this.hover(true));
        this.onEntity("hoverOff", () => this.hover(false));
    }

    override init(): void {
        this.interactableComponent = this.entity.getComponent(Interactable);
        this.spriteComponent = this.entity.getComponent(BasicSprite);
        this.shaderMeshComponent = this.entity.getComponent(ShaderMesh);
    }

    update(dt: number) {
        let x = Math.abs(game.worldMouse.x - this.transform.position.x);
        let y = Math.abs(game.worldMouse.y - this.transform.position.y);
        if (x < 20 && y < 40) {
            if (!this.highlighted) {
                this.highlighted = true;
                this.entity.emit("hoverOn");
            }
        }
        else {
            if (this.highlighted) {
                this.highlighted = false;
                this.entity.emit("hoverOff");
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
        if (this.shaderMeshComponent) {
            if (this.highlighted) {
                this.shaderMeshComponent.renderMesh.tint = 0x00ffff;
            }
            else {
                this.shaderMeshComponent.renderMesh.tint = 0xffffff;
            }
        }
        if (this.highlighted && game.input.mouse.getButtonUp(MouseButton.Left)) {
            //game.keys["f"] = false; //FOR TESTING ONLY
            this.entity.emit("interact");
        }
    }
    hover(hover: boolean) {
        this.highlighted = hover;
        game.tooltip.hoverEntity(this.entity, hover);

    }
    getTooltip() {
        let tooltipText = "";
        this.tooltipData.forEach((value, key) => tooltipText += `${key}: ${value}\n`);
        return this.tooltipName + "\n" + tooltipText;
    }

}