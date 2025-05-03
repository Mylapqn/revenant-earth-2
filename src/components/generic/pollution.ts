import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { ParticleText } from "../../hierarchy/particleText";
import { Terrain } from "../../world/terrain";
import { Vector } from "../../utils/vector";

export class Pollution extends Component {
    static componentType = "Pollution";
    speed = 2;
    dbName = "degault";
    totalPolluted = 0;
    nextText = 1;

    constructor(parent: Entity) {
        super(parent);
        this.onEntity("update", (dt) => this.update(dt));
    }

    override init(): void {
        this.speed = game.progressDatabase.db.get(this.dbName) ?? this.speed;
    }

    override applyData(data: { speed: number, dbName: string }): void {
        this.speed = data.speed;
        this.dbName = data.dbName;
    }

    override toData(): ComponentData {
        const data = { speed: this.speed, dbName: this.dbName };
        return super.toData(data);
    }

    update(dt: number) {
        const pollute = this.speed * dt;
        const adata = game.atmo.atmoData[Math.round(this.transform.position.x / game.terrain.dataWidth)];
        if (adata.pollution < 1) {
            adata.pollution += pollute;
            this.totalPolluted += pollute;
        }
        if (this.totalPolluted > this.nextText) {
            this.nextText += 1;
            new ParticleText("+1 pollution", this.transform.position.clone().add(new Vector(0, -40)));
        }
    }

}