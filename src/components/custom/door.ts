import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { UIElement, UIPanel } from "../../ui/ui";
import { UIButton } from "../../ui/uiButton";

export class Door extends Component {
    static componentType = "Door";
    targetScene: string = "None";
    doorId: string = "default-door";

    constructor(parent: Entity) {
        super(parent);
        this.onEntity("update", (dt) => this.update(dt));
        this.onEntity("interact", () => this.activate());
    }

    override init(): void {
        //game.player.position.set(...this.transform.position.xy());
    }

    override toData(): ComponentData {
        const data = { target: this.targetScene, doorId: this.doorId };
        return super.toData(data);
    }

    override applyData(data: { target: string, doorId: string }): void {
        this.targetScene = data.target;
        this.doorId = data.doorId;
    }

    activate() {
        game.loadScene(this.targetScene);
        const targetDoor = game.activeScene.findComponents(Door).find(comp => comp.doorId === this.doorId);
        if (targetDoor) {
            game.player.position = targetDoor.transform.position.clone();
            game.camera.position = targetDoor.transform.position.clone();
            if (game.camera.customTarget) game.camera.customTarget = targetDoor.transform.position.clone();
        }
    }

    update(dt: number) {
    }
    debugOptions(buttons: UIElement[]): UIElement[] {
        buttons.push(new UIButton(`Go through`, () => { this.activate() }));
        return super.debugOptions(buttons);
    }


}