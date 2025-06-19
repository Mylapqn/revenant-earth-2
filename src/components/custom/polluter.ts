import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { primitiveObject } from "../../hierarchy/serialise";

export class Polluter extends Component {
    static componentType = "Polluter";

    constructor(entity: Entity) {
        super(entity);
        this.onEntity("update", (dt) => this.update(dt));
        this.onEntity("interact", () => this.clean());
    }


    pollution = 0;
    override applyData(data?: { pollution?: number }): void {
        this.pollution = data?.pollution ?? 0;
    }

    override toData(): ComponentData {
        return super.toData({ pollution: this.pollution });
    }

    override init(): void {

    }

    clean(): void {
        this.entity.remove();
        game.score.addWithFx(100, game.camera.worldToRender(this.entity.transform.position));
    }


    update(dt: number): void {
        if (this.pollution > 0 && game.activeScene.hasTerrain) {
            if (game.terrain.getProperties(this.entity.transform.position.x).pollution < 1) {
                game.terrain.generatePollution(this.entity.transform.position.x, this.pollution * dt);
            }
        }
    }
}