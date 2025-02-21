import { game } from "../game";
import { Component } from "../hierarchy/component";
import { Entity } from "../hierarchy/entity";
import { ISerializable, KindedObject, StateMode } from "../hierarchy/serialise";

export class EntitySerializer extends Component implements ISerializable {
    static componentType = "EntitySerializer";
    constructor(parent: Entity, id: number) {
        super(parent, id);
        game.activeScene.register(this);
    }

    serialise(mode: StateMode): KindedObject | false {
        return this.entity.toData();
    }

    unload() {
        // ??
        this.entity.emit("unload");
        this.entity.remove();
    }
}