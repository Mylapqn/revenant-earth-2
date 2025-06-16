import { Debug } from "../../dev/debug";
import { game, Game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { ParticleText } from "../../hierarchy/particleText";
import { UIElement } from "../../ui/ui";
import { UIButton } from "../../ui/uiButton";
import { nextFrame, sleep } from "../../utils/utils";
import { Vector } from "../../utils/vector";
import { Door } from "../custom/door";
import { Interactable } from "./interactable";

export type TalkType = keyof typeof TalkComponent.talkDatabase;

export class TalkComponent extends Component {
    static componentType = "TalkComponent";
    interactable!: Interactable;
    private _talkId: TalkType = "default";
    public get talkId(): TalkType {
        return this._talkId;
    }
    public set talkId(value: TalkType) {
        this._talkId = value;
        this.talk = TalkComponent.talkDatabase[this.talkId];
        this.talkIndex = 0;
    }
    enabled: boolean = true;
    private talk: string[] = TalkComponent.talkDatabase[this.talkId];
    talkIndex = 0;
    talkTimer = 0;
    hideTimer = 0;
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
        this.talkElement = UIElement.create({ type: "div", parent: this.interactable.parentElement.htmlElement, classes: ["talk"], content: "" });
        this.talkContent = UIElement.create({ type: "p", parent: this.talkElement.htmlElement });
    }

    override toData(): ComponentData {
        const data = { talkId: this.talkId, enabled: this.enabled };
        return super.toData(data);
    }

    override applyData(data: { talkId: TalkType, enabled?: boolean }): void {
        this.enabled = data.enabled ?? true;
        this.talkId = data.talkId;
    }

    activate() {
        this.createTalk(this.talk[this.talkIndex]);
        this.talkIndex++;
        if (this.talkIndex >= this.talk.length) {
            this.talkIndex = 0;
            game.events.emit("talkEnd",this);
        }
    }

    async createTalk(text: string) {
        if (this.talkTimer > 0) {
            this.talkElement.htmlElement.classList.remove("appear");
            this.talkTimer = 0;
            await sleep(200);
        }
        else {
            this.setVisible(true);
            await nextFrame();
        }
        this.talkContent.htmlElement.innerText = text;
        this.talkElement.htmlElement.classList.add("appear");
        this.talkTimer = text.length * .1 + 2;
    }

    update(dt: number) {
        this.interactable.enabled = this.enabled;
        if (this.talkTimer > 0) {
            this.talkTimer -= dt;
            if (this.talkTimer <= 0) {
                this.talkElement.htmlElement.classList.remove("appear");
                this.talkTimer = 0;
                this.hideTimer = 1;
            }
        }
        if (this.hideTimer > 0) {
            this.hideTimer -= dt;
            if (this.hideTimer <= 0) {
                this.setVisible(false);
            }
        }
    }
    setVisible(visible: boolean) {
        this.talkElement.htmlElement.classList.toggle("hidden", !visible);
        this.hideTimer = 0;
    }
    debugOptions(buttons: UIElement[]): UIElement[] {
        buttons.push(new UIButton(`Talk`, () => { this.activate() }));
        return super.debugOptions(buttons);
    }

    static talkDatabase = {
        "spaceDirectorGreeting": ["Good evening.", "I'm the director of the UNERA project.", "I came to congratulate you on being chosen for the Earth Restoration Mission.", "Let's just do a few pre-flight checks."],
        "spaceDirectorTutorial": ["Try planting a plant in the left planter. This one has plenty of water and nutrition.", "See how the plant grows well in such conditions."],
        "default": ["Hi.", "They only gave me default dialogue :("],
    }
}