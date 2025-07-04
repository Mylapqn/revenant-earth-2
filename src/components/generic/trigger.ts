import { Graphics, Text } from "pixi.js";
import { game } from "../../game";
import { Entity } from "../../hierarchy/entity";
import { primitiveObject } from "../../hierarchy/serialise";
import { Debug } from "../../dev/debug";
import { Component } from "../../hierarchy/component";
import { ComponentData } from "../componentIndex";


declare module "../types" { interface ComponentRegistry { Trigger: Trigger } }
export default class Trigger extends Component {
    static componentType = "Trigger";
    name: string = "";
    radius: number = 100
    triggered = false;
    constructor(parent: Entity) {
        super(parent);
    }
    applyData(data: { name: string, radius?: number }): void {
        this.name = data.name;
        this.radius = data.radius || 100;
        this.onEntity("update", (dt) => this.update(dt));
    }
    toData(): ComponentData {
        const data: any = { name: this.name };
        if (this.radius !== 100) data.radius = this.radius
        return super.toData(data);
    }
    update(dt: number): void {
        if (game.camera.inViewX(this.transform.position.x, 200)) {
            const colliding = this.transform.position.distanceSquared(game.player.position) < this.radius * this.radius;
            if (colliding && !this.triggered) {
                this.triggered = true;
                game.events.emit("triggerEnter", this.name);
            }
            else if (!colliding && this.triggered) {
                this.triggered = false;
                game.events.emit("triggerExit", this.name);
            }
        }
    }
    debugDraw(graphics: Graphics): void {
        graphics.circle(this.transform.position.x, this.transform.position.y, this.radius);
        graphics.stroke({ color: 0xffff00, width: .25 });
        const text = new Text({ position: this.transform.position.toLike(), text: this.name, anchor: { x: 0, y: 0 }, style: { fontSize: 16, fontFamily: "monogram", fill: 0xffff00 }, parent: Debug.containerWorldspace, roundPixels: true });
        text.resolution = 4;
        //Debug.containerWorldspace.addChild(text);
    }
}