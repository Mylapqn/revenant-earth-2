import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { ParticleText } from "../../hierarchy/particleText";
import { Terrain } from "../../terrain";
import { Vector } from "../../vector";

export class PollutionComponent extends Component {
    static componentType = "PollutionComponent";
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
        const pollute = this.speed*dt;
        game.terrain.terrainData[Math.round(this.transform.position.x / game.terrain.dataWidth)].pollution += pollute;
        this.totalPolluted += pollute;
        if(this.totalPolluted >this.nextText){
            this.nextText+=1;
            new ParticleText("+1 pollution", this.transform.position.result().add(new Vector(0, -40)));
        }
    }

}