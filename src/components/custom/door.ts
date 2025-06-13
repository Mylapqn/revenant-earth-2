import { Game, game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { ParticleText } from "../../hierarchy/particleText";
import { UIElement, UIPanel } from "../../ui/ui";
import { UIButton } from "../../ui/uiButton";
import { Vector } from "../../utils/vector";

export class Door extends Component {
    static componentType = "Door";
    targetScene: string = "None";
    doorId: string = "default-door";
    enabled: boolean = true;

    constructor(parent: Entity) {
        super(parent);
        this.onEntity("update", (dt) => this.update(dt));
        this.onEntity("interact", () => this.activate());
    }

    override init(): void {
        //game.player.position.set(...this.transform.position.xy());
    }

    override toData(): ComponentData {
        const data = { target: this.targetScene, doorId: this.doorId, enabled: this.enabled };
        return super.toData(data);
    }

    override applyData(data: { target: string, doorId: string, enabled: boolean }): void {
        this.enabled = data.enabled ?? true;
        this.targetScene = data.target;
        this.doorId = data.doorId;
    }

    activate() {
        if (!this.enabled) {
            new ParticleText("Door locked", this.transform.position.clone().add(new Vector(0, -20)));
            return;
        }
        game.loadScene(this.targetScene);
        const targetDoor = game.activeScene.findComponents(Door).find(comp => comp.doorId === this.doorId);
        if (targetDoor) {
            game.player.position = targetDoor.transform.position.clone();
            game.camera.position = targetDoor.transform.position.clone().mult(Game.pixelScale);
            if (game.camera.customTarget) game.camera.customTarget = targetDoor.transform.position.clone().mult(Game.pixelScale);
        }
    }

    update(dt: number) {
    }
    debugOptions(buttons: UIElement[]): UIElement[] {
        buttons.push(new UIButton(`Go through`, () => { this.activate() }));
        return super.debugOptions(buttons);
    }


}