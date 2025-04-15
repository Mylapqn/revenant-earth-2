import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";

export class Door extends Component {
    static componentType = "Door";
    targetScene: string = "None";

    constructor(parent: Entity) {
        super(parent);
        this.onEntity("update", (dt) => this.update(dt));
        this.onEntity("interact", () => this.activate());
    }

    override init(): void {
        game.player.position.set(...this.transform.position.xy());
    }

    override toData(): ComponentData {
        const data = { target: this.targetScene }
        return super.toData(data);
    }

    override applyData(data: { target: string }): void {
        this.targetScene = data.target;
    }

    activate() {
        game.loadScene(this.targetScene);
    }

    update(dt: number) {
    }


}