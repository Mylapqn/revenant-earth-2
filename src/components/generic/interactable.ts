import { game } from "../../game";
import { Component } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { primitiveObject } from "../../hierarchy/serialise";
import { UI, UIElement, UIWorldSpaceElement } from "../../ui/ui";
import { Vector, Vectorlike } from "../../utils/vector";
import { BasicSprite } from "./basicSprite";

export class Interactable extends Component {
    static componentType = "Interactable";
    spriteComponent?: BasicSprite;
    highlighted = false;
    htmlElement!: UIWorldSpaceElement;
    promptElement!: UIElement;
    promptTextElement!: UIElement;
    enabled = true;
    offset = new Vector(0, 0);


    constructor(parent: Entity) {
        super(parent);
        this.onEntity("update", (dt) => this.update(dt));
    }

    override init(): void {
        this.spriteComponent = this.entity.getComponent(BasicSprite);
    }

    applyData(data?: { text?: string, offset?: Vectorlike }): void {
        this.htmlElement = new UIWorldSpaceElement("div", new Vector());
        UI.container.appendChild(this.htmlElement.htmlElement);

        this.promptElement = UIElement.create({ type: "div", parent: this.htmlElement.htmlElement, classes: ["prompt"], content: "F" });
        this.promptTextElement = UIElement.create({ type: "div", parent: this.htmlElement.htmlElement, classes: ["prompt-text"], content: "Interact" });
        data = data ?? {};
        this.setText(data.text ?? "Interact");
        this.offset = Vector.fromLike(data.offset ?? { x: 0, y: 0 });


        super.applyData(data);
    }

    remove(): void {
        this.htmlElement?.remove();
        super.remove();
    }

    setText(text: string) { this.promptTextElement.htmlElement.innerHTML = text; }

    update(dt: number) {
        if (!this.enabled) {
            this.htmlElement.htmlElement.style.display = "none";
            return;
        }
        this.htmlElement.setWorldPosition(this.transform.position.clone().add(this.offset));
        if (game.camera.inViewX(this.transform.position.x, 200)) {
            let x = Math.abs(game.player.position.x - this.transform.position.x);
            let y = Math.abs(game.player.position.y - this.transform.position.y);
            if (x < 20 && y < 40) {
                if (!this.highlighted) {
                    this.highlighted = true;
                }
            }
            else {
                if (this.highlighted) {
                    this.highlighted = false;
                }
            }

            /*if (this.spriteComponent) {
                if (this.highlighted) {
                    this.spriteComponent.sprite.tint = 0x00ffff;
                }
                else {
                    this.spriteComponent.sprite.tint = 0xffffff;
                }
            }*/
            if (this.highlighted && game.input.keyDown("f")) {
                //game.keys["f"] = false; //FOR TESTING ONLY
                this.entity.emit("interact");
            }
            this.promptElement.htmlElement.classList.toggle("highlight", this.highlighted);
            this.promptTextElement.htmlElement.classList.toggle("highlight", this.highlighted);
        }
        else {
            this.highlighted = false;
        }
    }

}