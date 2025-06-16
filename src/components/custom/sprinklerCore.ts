import { Component } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { Interactable } from "../generic/interactable";

export class SprinklerCore extends Component {
    static componentType = "SprinklerCore";

    active = false;
    waterLevel = 999;

    constructor(entity: Entity) {
        super(entity);
        this.onEntity("interact", () => this.toggle());
    }

    override init(){
        super.init();
        this.entity.getComponent(Interactable)?.setText("Activate");
    }

    toggle() {
        this.active = !this.active;
    }
}