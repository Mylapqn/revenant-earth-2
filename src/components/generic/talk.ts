import { game, Game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { ParticleText } from "../../hierarchy/particleText";
import { UIElement } from "../../ui/ui";
import { UIButton } from "../../ui/uiButton";
import { sleep } from "../../utils/utils";
import { Vector } from "../../utils/vector";
import { Door } from "../custom/door";
import { Interactable } from "./interactable";

export class TalkComponent extends Component {
    static componentType = "TalkComponent";
    interactable!: Interactable;
    talkId: string = "default-talk";
    enabled: boolean = true;
    talk: string[] = ["Hi.", "I'm the director.", "Let's explore the station. The station has two planters. I like planters. Plant some plants in the planters."];
    talkIndex = 0;
    talkTimer = 0;
    talkElement!: UIElement;
    talkContent!: UIElement;
    constructor(parent: Entity) {
        super(parent);
        this.onEntity("update", (dt) => this.update(dt));
        this.onEntity("interact", () => this.activate());
    }

    override init(): void {
        //game.player.position.set(...this.transform.position.xy());
        this.interactable = this.entity.getComponent(Interactable)!;
        this.interactable.setText("Talk");
        this.talkElement = UIElement.create({ type: "div", parent: this.interactable.parentElement.htmlElement, classes: ["talk"], content: ""});
        this.talkContent = UIElement.create({ type: "p", parent: this.talkElement.htmlElement});
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
        this.createTalk(this.talk[this.talkIndex]);
        this.talkIndex++;
        if (this.talkIndex >= this.talk.length) this.talkIndex = 0;
    }

    async createTalk(text: string) {
        if(this.talkTimer > 0){
            this.talkElement.htmlElement.classList.remove("appear");
            this.talkTimer = 0;
            await sleep(200);
        }
        this.talkContent.htmlElement.innerText = text;
        this.talkElement.htmlElement.classList.add("appear");
        this.talkTimer = text.length*.1+2;
    }

    update(dt: number) {
        this.interactable.enabled = this.enabled;
        if(this.talkTimer > 0){
            this.talkTimer -= dt;
            if(this.talkTimer <= 0){
                this.talkElement.htmlElement.classList.remove("appear");
                this.talkTimer = 0;
            }
        }
    }
    debugOptions(buttons: UIElement[]): UIElement[] {
        buttons.push(new UIButton(`Talk`, () => { this.activate() }));
        return super.debugOptions(buttons);
    }
}