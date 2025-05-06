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
    private oldZoom = 1;
    customTarget?: Vector;

    get screen() {
        return {
            x: window.innerWidth,
            y: window.innerHeight,
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


    update(dt: number) {
        let targetPosition = new Vector(0, 0);
        if (this.customTarget) {
            targetPosition = this.customTarget.clone();
        }
        else {
            targetPosition.x = game.player.position.x * Game.pixelScale;
            targetPosition.y = game.player.position.y * Game.pixelScale - this.viewport.y * .2;
        }

        this.position.x = (targetPosition.x + this.position.x * 19) / 20;
        this.position.y = (targetPosition.y + this.position.y * 19) / 20;

        this.screenPixelOffset = new Vector(-this.position.x + this.middle.x, -this.position.y + this.middle.y);
        this.pixelOffset = this.screenPixelOffset.clone().mult(1 / Game.pixelScale).floor();
        this.offsetRemainder = this.screenPixelOffset.clone().mult(1 / Game.pixelScale).sub(this.pixelOffset);
        game.playerContainer.position.set(this.screenPixelOffset.x, this.screenPixelOffset.y);
        //game.terrainContainer.position.set(this.subpixelOffset.x, this.subpixelOffset.y);
        Debug.graphicsWorldspace.position.set(this.screenPixelOffset.x, this.screenPixelOffset.y);
        if (this.oldZoom != this.zoom) game.resize();
        this.oldZoom = this.zoom;
        game.app.stage.scale.set(this.zoom);

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
    worldToRender(v: Vectorlike) {
        return this.screenToRender(this.worldToScreen(v));
    }
    inView(v: Vectorlike, padding = 0) {
        const screenPos = this.worldToScreen(v);
        return screenPos.x > -padding && screenPos.x < this.screen.x + padding && screenPos.y > -padding && screenPos.y < this.screen.y + padding;
    }
}
