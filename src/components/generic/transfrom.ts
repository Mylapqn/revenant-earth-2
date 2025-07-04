import { Component } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { Vector, Vectorlike } from "../../utils/vector";
import { ComponentData } from "../componentIndex";


declare module "../types" { interface ComponentRegistry { Transform: Transform } }
export default class Transform extends Component {
    static componentType = "Transform";
    position = new Vector(0, 0);
    velocity = new Vector(0, 0);
    rotation = 0;

    constructor(entity: Entity) {
        super(entity);
        this.entity.transform = this;
        this.onEntity("update", (dt) => this.update(dt));

    }

    toData(): ComponentData {
        const data = {
            position: this.position.toLike(),
            velocity: this.velocity.toLike()
        };

        return super.toData(data);
    }

    override applyData(data: { position?: Vectorlike; velocity?: Vectorlike }) {
        if (data.position) this.position = Vector.fromLike(data.position);
        if (data.velocity) this.velocity = Vector.fromLike(data.velocity);
    }

    update(dt: number) {
        if(this.velocity.x != 0)
        this.position.x += this.velocity.x * dt;
        if(this.velocity.y != 0)
        this.position.y += this.velocity.y * dt;
    }

    worldCoords(vector: Vectorlike): Vector {
        return new Vector(this.position.x + vector.x, this.position.y + vector.y);
    }
}