import { game } from "./game";
import { Vector, Vectorlike } from "./vector";

export class Camera {
    position = new Vector(0, 0);

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
        const worldScale = 4;
        const targetPosition = new Vector(0, 0);
        targetPosition.x = game.player.position.x * worldScale;
        targetPosition.y = game.player.position.y * worldScale;

        this.position.x = (targetPosition.x + this.position.x * 19) / 20;
        this.position.y = (targetPosition.y + this.position.y * 19) / 20;

        const offset = new Vector(-this.position.x + this.middle.x, -this.position.y + this.middle.y);
        game.playerContainer.position.set(offset.x, offset.y);
        game.terrainContainer.position.set(offset.x, offset.y);
        game.worldDebugGraphics.position.set(offset.x, offset.y);
        const sizedOffset = offset.result().mult(1/4);
        game.pixelLayer.container.position.set(sizedOffset.x, sizedOffset.y);
    }
}
