import { game } from "../game";
import { Component } from "../hierarchy/component";
import { Entity } from "../hierarchy/entity";
import { ISerializable, KindedObject, StateMode } from "../hierarchy/serialise";

export class EntitySerializer extends Component implements ISerializable {
    static componentType = "EntitySerializer";
    constructor(parent: Entity, id: number) {
        super(parent, id);
        game.stateManager.register(this);
    }

    serialise(mode: StateMode): KindedObject | false {
        return this.parent.toData();
    }
}