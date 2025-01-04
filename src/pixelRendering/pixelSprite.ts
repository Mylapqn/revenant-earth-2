import { ObservablePoint, Observer, Point, Sprite, Texture } from "pixi.js";

export class PixelSprite extends Sprite {
    private realPosition: Point = new Point(0, 0);
    constructor() {
        super();
        this.onRender = () => {
            this.position.x = Math.round(this.realPosition.x);
            this.position.y = Math.round(this.realPosition.y);
        }
    }

    set x(value: number) { this.realPosition.x = value; this.position.x = Math.round(value); }
    set y(value: number) { this.realPosition.y = value; this.position.y = Math.round(value); }

    get x() { return this.realPosition.x; }
    get y() { return this.realPosition.y; }
}