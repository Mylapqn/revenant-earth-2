import { game } from "../../game";
import { Component } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { UI } from "../../ui/ui";
import { UIAbsoluteElement } from "../../ui/uiAbsoluteElement";
import { UIElement } from "../../ui/uiElement";
import { Vector, Vectorlike } from "../../utils/vector";
import { ComponentData } from "../componentIndex";
import BasicSprite from "./basicSprite";

declare module "../types" { interface ComponentRegistry { Interactable: Interactable } }
export default class Interactable extends Component {
    static componentType = "Interactable";
    spriteComponent?: BasicSprite;
    highlighted = false;
    parentElement!: UIAbsoluteElement;
    promptElement!: UIElement;
    promptTextElement!: UIElement;
    enabled = true;
    offset = new Vector(0, 0);
    initialText!: string;

    constructor(parent: Entity) {
        super(parent);
        this.onEntity("update", (dt) => this.update(dt));
    }

    override init(): void {
        this.spriteComponent = this.entity.getComponent(BasicSprite);
    }

    override toData(): ComponentData {
        const data: any = {};
        data.offset = this.offset.toLike();
        data.text = this.initialText;
        return super.toData(data);
    }

    applyData(data?: { text?: string, offset?: Vectorlike }): void {
        this.parentElement = new UIAbsoluteElement({ type: "div", worldPosition: new Vector() });
        UI.container.appendChild(this.parentElement.htmlElement);
        this.parentElement.blockMouse = false;
        this.promptElement = new UIElement({ type: "div", parent: this.parentElement.htmlElement, classes: ["prompt"], content: "F", blockMouse: false });
        this.promptTextElement = new UIElement({ type: "div", parent: this.parentElement.htmlElement, classes: ["prompt-text"], content: "Interact", blockMouse: false });
        data = data ?? {};
        this.initialText = data.text ?? "Interact";
        this.setText(this.initialText);
        this.offset = Vector.fromLike(data.offset ?? { x: 0, y: 0 });


        super.applyData(data);
    }

    remove(): void {
        this.parentElement?.remove();
        super.remove();
    }

    setText(text: string) { this.promptTextElement.htmlElement.innerHTML = text; }

    update(dt: number) {
        if (!this.enabled) {
            this.parentElement.htmlElement.style.display = "none";
            return;
        }
        const offsetPosition = this.transform.position.clone().add(this.offset);
        this.parentElement.setWorldPosition(offsetPosition);
        if (game.camera.inViewX(offsetPosition.x, 200)) {
            let x = Math.abs(game.player.position.x - offsetPosition.x);
            let y = Math.abs(game.player.position.y - offsetPosition.y);
            if (x < 30 && y < 40) {
                if (!this.highlighted) {
                    this.highlighted = true;
                    //game.soundManager.soundLibrary.play("hover",{ volume: 0.2 ,speed:0.5});
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
                game.soundManager.soundLibrary.play("click");
                this.entity.emit("interact");
                game.events.emit("entityInteract", this.entity);
            }
            this.promptElement.htmlElement.classList.toggle("highlight", this.highlighted);
            this.promptTextElement.htmlElement.classList.toggle("highlight", this.highlighted);
        }
        else {
            this.highlighted = false;
        }
    }

}