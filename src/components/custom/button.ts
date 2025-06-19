import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { ParticleText } from "../../hierarchy/particleText";
import { UIElement } from "../../ui/uiElement";
import { UIButton } from "../../ui/uiButton";
import { Vector } from "../../utils/vector";
import { Interactable } from "../generic/interactable";

export class Button extends Component {
    static componentType = "Button";
    dbName: string = "None";

    constructor(parent: Entity) {
        super(parent);
        this.onEntity("update", (dt) => this.update(dt));
        this.onEntity("interact", () => this.activate());
    }

    override init(): void {
        //game.player.position.set(...this.transform.position.xy());
        this.entity.getComponent(Interactable)?.setText("Activate");
    }

    override toData(): ComponentData {
        const data = { dbName: this.dbName }
        return super.toData(data);
    }

    override applyData(data: { dbName: string }): void {
        this.dbName = data.dbName;
    }

    activate() {
        game.progressDatabase.db.set(this.dbName, 0);
        new ParticleText("Activated " + this.dbName, this.transform.position.clone().add(new Vector(0, -40)));
    }

    update(dt: number) {
    }

    debugOptions(buttons: UIElement[]): UIElement[] {
        buttons.push(new UIButton(`Activate ${this.dbName}`, () => { this.activate() }));
        return super.debugOptions(buttons);
    }


}