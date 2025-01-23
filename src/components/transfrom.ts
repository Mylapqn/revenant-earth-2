import { Component, ComponentData } from "../hierarchy/component";
import { Entity } from "../hierarchy/entity";
import { Vector, Vectorlike } from "../vector";

export type TransformableEntity = {
    position: Vector;
    velocity: Vector;
} & Entity;


export class Transform extends Component {
    static componentType = "Transform";

    override parent: TransformableEntity;

    constructor(parent: Entity, id: number) {
        super(parent, id);
        this.parent = parent as TransformableEntity;
        this.parent.position = new Vector(0, 0);
        this.parent.velocity = new Vector(0, 0);
        this.parent.on("update", (dt) => this.update(dt));

    }

    toData(): ComponentData {
        const data = {
            position: this.parent.position.toLike(),
            velocity: this.parent.velocity.toLike()
        };

        const out = super.toData();
        out.data = data;
        return out;
    }

    override applyData(data: { position?: Vectorlike; velocity?: Vectorlike }) {
        if (data.position) this.parent.position = Vector.fromLike(data.position);
        if (data.velocity) this.parent.velocity = Vector.fromLike(data.velocity);
    }

    update(dt: number) {
        this.parent.position.x += this.parent.velocity.x * dt;
        this.parent.position.y += this.parent.velocity.y * dt;
    }
}