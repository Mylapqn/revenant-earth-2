import { Ellipse } from "detect-collisions";
import { game } from "./game";
import { Graphics } from "pixi.js";
import { PixelSprite } from "./pixelRendering/pixelSprite";
import { Vector } from "./types";

export class Player {
    position = new Vector();
    sprite: PixelSprite;
    playerHitbox: Ellipse;
    graphics: Graphics;
    constructor() {
        this.graphics = new Graphics();
        this.playerHitbox = game.collisionSystem.createEllipse({ x: 0, y: 0 }, 10, 20);

        this.sprite = new PixelSprite();
        this.sprite.anchor.set(0.5);
        //player.scale.set(4);
        this.sprite.scale.x *= -1;
        game.pixelLayer.container.addChild(this.graphics);
        game.pixelLayer.container.addChild(this.sprite);
    }

    update() {
        this.playerHitbox.setPosition(this.position.x, this.position.y);
        this.playerHitbox.updateBody(true);

        game.collisionSystem.checkOne(this.playerHitbox, (response) => {
            this.position.x -= response.overlapV.x;
            this.position.y -= response.overlapV.y;
            this.playerHitbox.setPosition(this.position.x, this.position.y);
            this.playerHitbox.updateBody(true);
        });

        this.graphics.clear();
        this.graphics.ellipse(this.position.x, this.position.y, this.playerHitbox.radiusX, this.playerHitbox.radiusY);
        this.graphics.fill(0xff0000);

        this.sprite.x = this.position.x;
        this.sprite.y = this.position.y;
    }
}
