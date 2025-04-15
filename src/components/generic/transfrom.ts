import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { Vector, Vectorlike } from "../../utils/vector";



export class Transform extends Component {
    static componentType = "Transform";
    position = new Vector(0, 0);
    velocity = new Vector(0, 0);

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
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
    }
}