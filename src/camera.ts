import { Debug } from "./dev/debug";
import { Game, game } from "./game";
import { lerp } from "./utils/utils";
import { Vector, Vectorlike } from "./utils/vector";

export class Camera {
    position = new Vector(0, 0);

    screenPixelOffset = new Vector(0, 0);
    pixelOffset = new Vector(0, 0);
    offsetRemainder = new Vector(0, 0);
    zoom = 1;
    targetZoom = 1;
    zoomSpeed = 1;
    private oldZoom = 1;
    customTarget?: Vector;
    private _screen = { x: window.innerWidth, y: window.innerHeight };

    get screen() {
        return {
            x: this._screen.x,
            y: this._screen.y
        };
    }

    get viewport() {
        return {
            x: this.screen.x / this.zoom,
            y: this.screen.y / this.zoom,
        };
    }

    get middle() {
        return {
            x: this.viewport.x / 2,
            y: this.viewport.y / 2,
        };
    }

    get worldPosition(): Vectorlike {
        return this.position.clone().mult(1 / Game.pixelScale);
    }

    get pixelScreen() {
        return {
            x: Math.floor(this.viewport.x / Game.pixelScale),
            y: Math.floor(this.viewport.y / Game.pixelScale)
        }
    }
    get ratio() {
        return this.screen.x / this.screen.y
    }

    getPixelOffset(depth: number): { offset: Vectorlike; remainder: Vectorlike } {
        const screenPixelOffset = this.screenPixelOffset.clone().mult(depth).mult(1 / Game.pixelScale);
        const pixelOffset = screenPixelOffset.clone().floor();
        const offsetRemainder = screenPixelOffset.clone().sub(pixelOffset);
        return { offset: pixelOffset, remainder: offsetRemainder };
    }
    getCenteredPixelOffset(depth: number): { offset: Vectorlike; remainder: Vectorlike } {
        const furthestOffset = new Vector(0, this.middle.y);
        const screenPixelOffset = Vector.lerp(furthestOffset, this.screenPixelOffset.clone(), depth).mult(1 / Game.pixelScale);
        const pixelOffset = screenPixelOffset.clone().floor();
        const offsetRemainder = screenPixelOffset.clone().sub(pixelOffset);
        return { offset: pixelOffset, remainder: offsetRemainder };
    }

    resize() {
        this._screen = { x: window.innerWidth, y: window.innerHeight };
    }


    update(dt: number) {
        let targetPosition = new Vector(0, 0);
        if (this.customTarget) {
            targetPosition = this.customTarget.clone();
        }
        else {
            targetPosition.set(this.targetPlayerPosition());
        }

        this.position.x = (targetPosition.x + this.position.x * 19) / 20;
        this.position.y = (targetPosition.y + this.position.y * 19) / 20;

        this.screenPixelOffset = new Vector(-this.position.x + this.middle.x, -this.position.y + this.middle.y);
        this.pixelOffset = this.screenPixelOffset.clone().mult(1 / Game.pixelScale).floor();
        this.offsetRemainder = this.screenPixelOffset.clone().mult(1 / Game.pixelScale).sub(this.pixelOffset);
        game.playerContainer.position.set(this.screenPixelOffset.x, this.screenPixelOffset.y);
        //game.terrainContainer.position.set(this.subpixelOffset.x, this.subpixelOffset.y);
        Debug.containerWorldspace.position.set(this.screenPixelOffset.x, this.screenPixelOffset.y);


        //if (this.oldZoom != this.zoom) game.resize();
        //this.oldZoom = this.zoom;


    }

    targetPlayerPosition() {
        return {
            x: game.player.position.x * Game.pixelScale,
            y: game.player.position.y * Game.pixelScale - this.viewport.y * .2
        }
    }

    processZoom(dt: number) {
        if (Math.abs(this.zoom - this.targetZoom) < .01) this.zoom = this.targetZoom;
        else {
            this.zoom = lerp(this.zoom, this.targetZoom, 2 * dt * this.zoomSpeed);
        }
        if (this.oldZoom != this.zoom) {
            game.resize()
            game.app.stage.scale.set(this.zoom);
        }
        this.oldZoom = this.zoom;
    }

    worldToScreen(v: Vectorlike) {
        return new Vector(v.x, v.y).mult(Game.pixelScale).sub(this.position).add(this.middle);
    }
    screenToWorld(v: Vectorlike) {
        return new Vector(v.x, v.y).mult(1 / this.zoom).add(this.position).sub(this.middle).mult(1 / Game.pixelScale);
    }
    screenToRender(v: Vectorlike) {
        return new Vector(v.x, v.y).vecdiv(this.viewport)
    }
    renderToScreen(v: Vectorlike) {
        return new Vector(v.x, v.y).vecmult(this.viewport)
    }
    worldToRender(v: Vectorlike) {
        return this.screenToRender(this.worldToScreen(v));
    }
    inViewX(x: number, padding = 0) {
        const screenPosX = x * Game.pixelScale - this.position.x + this.middle.x;
        return screenPosX > -padding && screenPosX < this.screen.x + padding;
    }
    inViewY(y: number, padding = 0) {
        const screenPosY = y * Game.pixelScale - this.position.y + this.middle.y;
        return screenPosY > -padding && screenPosY < this.screen.y + padding;
    }
    inView(v: Vectorlike, padding = 0) {
        return this.inViewX(v.x, padding) && this.inViewY(v.y, padding);
    }
    inViewBox(pos: Vectorlike, min: Vectorlike, max: Vectorlike, padding = 0) {
        const topLeft = { x: pos.x + min.x, y: pos.y + min.y };
        const topRight = { x: pos.x + max.x, y: pos.y + min.y };
        const bottomRight = { x: pos.x + max.x, y: pos.y + max.y };
        const bottomLeft = { x: pos.x + min.x, y: pos.y + max.y };
        return this.inView(topLeft, padding) || this.inView(bottomRight, padding) || this.inView(topRight, padding) || this.inView(bottomLeft, padding);
    }
}
