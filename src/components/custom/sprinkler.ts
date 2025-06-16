import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { SprinklerCore } from "./sprinklerCore";

export class Sprinkler extends Component {
    static componentType = "Sprinkler";

    sprinklerCore?: SprinklerCore;
    tempSprinklerCore?: number;

    constructor(entity: Entity) {
        super(entity);
        this.onEntity("update", (dt) => this.update(dt));
    }

    override init() {
        super.init();
        if (this.tempSprinklerCore) {
            const entity = game.activeScene?.findEntity(this.tempSprinklerCore);
            if (entity) this.sprinklerCore = entity.getComponent(SprinklerCore);
        }
    }

    override toData(): ComponentData {
        const data = {} as Parameters<this["applyData"]>[0];
        if (this.sprinklerCore) data.sprinklerCore = this.sprinklerCore.entity.id;
        return super.toData(data);
    }

    override applyData(data: { sprinklerCore?: number; }): void {
        if (data.sprinklerCore) this.tempSprinklerCore = data.sprinklerCore;
    }

    ticker = 0;
    update(dt: number) {
        if (this.sprinklerCore == undefined) return;
        if (!this.sprinklerCore.active) return;
        if (this.sprinklerCore.waterLevel <= 0) return;
        this.ticker += dt;
        if (this.ticker > 1) {
            this.tick();
        }
    }

    tick() {
        const sprinklerRate = 0.2
        this.sprinklerCore!.waterLevel -= sprinklerRate;
        this.ticker = 0;
        game.terrain.addMoisture(this.transform.position.x + game.terrain.dataWidth, sprinklerRate / 4);
        game.terrain.addMoisture(this.transform.position.x - game.terrain.dataWidth, sprinklerRate / 4);
        game.terrain.addMoisture(this.transform.position.x, sprinklerRate / 2);
    }
}