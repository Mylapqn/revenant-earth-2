import { game, Game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { ParticleText } from "../../hierarchy/particleText";
import { UIElement } from "../../ui/ui";
import { UIButton } from "../../ui/uiButton";
import { Vector } from "../../utils/vector";
import { Door } from "../custom/door";
import { Interactable } from "./interactable";

export class TalkComponent extends Component {
    static componentType = "TalkComponent";
    interactable!: Interactable;
    talkId: string = "default-talk";
    enabled: boolean = true;
    talk: string[] = ["Hi.", "I'm the director."];
    talkIndex = 0;
    constructor(parent: Entity) {
        super(parent);
        this.onEntity("update", (dt) => this.update(dt));
        this.onEntity("interact", () => this.activate());
    }

    override init(): void {
        //game.player.position.set(...this.transform.position.xy());
        this.interactable = this.entity.getComponent(Interactable)!;
        this.interactable.setText("Talk");
    }

    override toData(): ComponentData {
        const data = { talkId: this.talkId, enabled: this.enabled };
        return super.toData(data);
    }

    override applyData(data: { talkId: string, enabled?: boolean }): void {
        this.enabled = data.enabled ?? true;
        this.talkId = data.talkId;
    }

    activate() {
        new ParticleText(this.talk[this.talkIndex], this.transform.position.clone().add(new Vector(0, -10)).add(this.interactable.offset));
        this.talkIndex++;
        if (this.talkIndex >= this.talk.length) this.talkIndex = 0;
    }

    update(dt: number) {
        this.interactable.enabled = this.enabled;
    }
    debugOptions(buttons: UIElement[]): UIElement[] {
        buttons.push(new UIButton(`Talk`, () => { this.activate() }));
        return super.debugOptions(buttons);
    }
}