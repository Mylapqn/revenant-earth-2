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
        if (value == this._talkId) return;
        this._talkId = value;
        this.talk = TalkComponent.talkDatabase[this.talkId];
        this.talkIndex = 0;
        //if(this.talkTimer > 0) this.showTalk();
    }
    autoTalk: number = 0;
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
        this.onEntity("interact", () => this.click());
    }

    override init(): void {
        //game.player.position.set(...this.transform.position.xy());
        this.interactable = this.entity.getComponent(Interactable)!;
        this.interactable.setText("Talk");
        this.talkElement = UIElement.create({ type: "div", parent: this.interactable.parentElement.htmlElement, classes: ["talk"], content: "",blockMouse: false });
        this.talkContent = UIElement.create({ type: "p", parent: this.talkElement.htmlElement,blockMouse: false });
    }

    override toData(): ComponentData {
        const data = { talkId: this.talkId, enabled: this.enabled };
        return super.toData(data);
    }

    override applyData(data: { talkId: TalkType, enabled?: boolean }): void {
        this.enabled = data.enabled ?? true;
        this.talkId = data.talkId;
    }

    click() {
        this.autoTalk = 0;
        this.activate();
    }

    activate() {
        this.createTalk(this.talk[this.talkIndex]);
        this.talkIndex++;
        if (this.talkIndex >= this.talk.length) {
            this.talkIndex = 0;
            this.interactable.setText("Talk");
            game.events.emit("talkEnd", this);
        }
        else {
            this.interactable.setText("Next");
        }
    }

    async showTalk() {
        await this.createTalk(this.talk[this.talkIndex]);
    }

    async createTalk(text: string) {
        if (this.talkTimer > 0) {
            this.talkElement.htmlElement.classList.remove("appear");
            this.talkTimer = 0;
            this.hideTimer = 0;
            await sleep(200);
        }
        else {
            this.setVisible(true);
            await nextFrame();
        }
        this.talkContent.htmlElement.innerHTML = text;
        this.talkElement.htmlElement.classList.add("appear");
        this.talkTimer = text.length * .05 + 2;
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
            else if (this.autoTalk > 0 && this.talkTimer > 0 && this.talkTimer < .5) {
                this.autoTalk--;
                this.activate();
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
        this.talkElement?.htmlElement.classList.toggle("hidden", !visible);
        this.hideTimer = 0;
    }
    debugOptions(buttons: UIElement[]): UIElement[] {
        buttons.push(new UIButton(`Talk`, () => { this.activate() }));
        return super.debugOptions(buttons);
    }

    static talkDatabase = {
        "spaceDirectorGreeting": ["Good evening.", "I'm the director of the <b>UNERA project.</b>", "I came to congratulate you on being chosen for the Earth Restoration Mission.", "Let's just do a few pre-flight checks.", "Try planting a plant in the <b>left planter</b>. It has <b>plenty of water</b> and nutrition.<br>See how the plant grows well in such conditions."],
        "spaceDirectorTutorialLeft": ["Try planting a plant in the <b>left planter</b>. It has <b>plenty of water</b> and nutrition.", "See how the plant grows well in such conditions."],
        "spaceDirectorTutorialRight": ["Now try it in the <b>right planter</b>. It has <b>dry and poor soil</b>.", "See how the plant struggles in such conditions."],
        "spaceDirectorTutorialComplete": ["That's it! You're ready for the mission.", "You can proceed to the <b>door on the right</b> and board the landing capsule.", "Good luck!"],
        "default": ["Hi.", "They only gave me default dialogue :("],
    }
}