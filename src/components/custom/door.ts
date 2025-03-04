import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";

export class Door extends Component {
    static componentType = "Door";
    targetScene: string = "Scene";

    constructor(parent: Entity, id: number) {
        super(parent, id);
        this.onEntity("update", (dt) => this.update(dt));
        this.onEntity("interact", () => {game.loadScene(this.targetScene);});
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

    update(dt: number) {
    }


}