import { Game, game } from "./game";
import { Vector, Vectorlike } from "./vector";

export class Camera {
    position = new Vector(0, 0);
    
    screenPixelOffset = new Vector(0, 0); 
    pixelOffset = new Vector(0, 0);
    offsetRemainder = new Vector(0, 0);

    get screen() {
        return {
            x: window.innerWidth,
            y: window.innerHeight,
        };
    }

    get middle() {
        return {
            x: this.screen.x / 2,
            y: this.screen.y / 2,
        };
    }

    get worldPosition(): Vectorlike {
        return this.position.result().mult(1/4);
    }


    update(dt: number) {
        const targetPosition = new Vector(0, 0);
        targetPosition.x = game.player.position.x * Game.pixelScale;
        targetPosition.y = game.player.position.y * Game.pixelScale;

        this.position.x = (targetPosition.x + this.position.x * 19) / 20;
        this.position.y = (targetPosition.y + this.position.y * 19) / 20;

        this.screenPixelOffset = new Vector(-this.position.x + this.middle.x, -this.position.y + this.middle.y);
        this.pixelOffset = this.screenPixelOffset.result().mult(1/Game.pixelScale).floor();
        this.offsetRemainder = this.screenPixelOffset.result().mult(1/Game.pixelScale).sub(this.pixelOffset);
        game.playerContainer.position.set(this.screenPixelOffset.x, this.screenPixelOffset.y);
        //game.terrainContainer.position.set(this.subpixelOffset.x, this.subpixelOffset.y);
        game.worldDebugGraphics.position.set(this.screenPixelOffset.x, this.screenPixelOffset.y);

    }
}
