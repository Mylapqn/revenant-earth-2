import { Ellipse } from "detect-collisions";
import { game } from "./game";
import { Graphics, Sprite } from "pixi.js";
import { PixelSprite } from "./pixelRendering/pixelSprite";
import { Vector } from "./vector";
import { PixelLayer } from "./pixelRendering/pixelLayer";
import { LimbSystem } from "./limbs/limbSystem";

export class Player {
    position = new Vector(200, 0);
    sprite: Sprite;
    playerHitbox: Ellipse;
    graphics: Graphics;
    legGraphics: Graphics;
    velocity = new Vector();
    pixelLayer: PixelLayer;
    limbSystem = new LimbSystem();
    get grounded() {
        return this.groundedTimer > 0;
    }
    groundedTimer = 0;
    constructor() {
        this.pixelLayer = new PixelLayer(64, 64);
        this.graphics = new Graphics();
        this.legGraphics = new Graphics();
        this.legGraphics.position = new Vector(32, 32);

        let limbGroup = this.limbSystem.addGroup(new Vector(7, 18), 40);
        limbGroup.addLimb(new Vector(5, 0), 9).origin = new Vector(-1, 0);
        limbGroup.addLimb(new Vector(-5, 0), 9).origin = new Vector(1, 0);
        /*
        const kok = 30;
        let limbGroup2 = this.limbSystem.addGroup(new Vector(30, 20), 40);
        limbGroup2.minLimbsStand = 3;
        limbGroup2.addLimb(new Vector(5, 0), kok);
        limbGroup2.addLimb(new Vector(-5, 0), kok);
        limbGroup2.addLimb(new Vector(5, 0), kok);
        limbGroup2.addLimb(new Vector(-5, 0), kok);

        let limbGroup3 = this.limbSystem.addGroup(new Vector(-30, 20), 40);
        limbGroup3.minLimbsStand = 3;
        limbGroup3.addLimb(new Vector(5, 0), kok);
        limbGroup3.addLimb(new Vector(-5, 0), kok);
        limbGroup3.addLimb(new Vector(5, 0), kok);
        limbGroup3.addLimb(new Vector(-5, 0), kok);
        */
        this.playerHitbox = game.collisionSystem.createEllipse({ x: 0, y: 0 }, 10, 16);

        this.sprite = new Sprite();
        this.sprite.anchor.set(0.5);
        this.sprite.position.set(32, 32);
        //this.pixelLayer.container.pivot.set(32,64);
        //player.scale.set(4);
        this.sprite.scale.x *= -1
        //game.pixelLayer.container.addChild(this.graphics);
        game.playerContainer.addChild(this.pixelLayer.sprite);
        this.pixelLayer.container.addChild(this.graphics);
        //this.pixelLayer.container.addChild(this.sprite);
        this.pixelLayer.container.addChild(this.legGraphics);
    }

    update(dt: number) {
        if (game.keys["d"] && this.velocity.x < 40) this.velocity.x += 300 * dt;
        else if (game.keys["a"] && this.velocity.x > -40) this.velocity.x -= 300 * dt;
        else if (this.grounded) this.velocity.x *= 0.9;
        if (game.keys[" "] && this.grounded) {
            this.velocity.y = -300;
            this.groundedTimer = 0;
        };

        if (!this.grounded) this.velocity.y += 1000 * dt;


        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;

        this.playerHitbox.setPosition(this.position.x, this.position.y);
        this.playerHitbox.updateBody(true);

        this.groundedTimer -= dt;

        game.collisionSystem.checkOne(this.playerHitbox, (response) => {
            this.groundedTimer = .1;
            this.velocity.x -= response.overlapV.x;
            this.velocity.y = 0;
            this.position.x -= response.overlapV.x;
            this.position.y -= response.overlapV.y;
            this.playerHitbox.setPosition(this.position.x, this.position.y);
            this.playerHitbox.updateBody(true);
        });

        this.limbSystem.update(dt, this.position.result(), this.grounded);
        let offset = 0;
        if (this.limbSystem.limbGroups[0].passingPhase > 0) offset = Math.round(this.limbSystem.limbGroups[0].passingPhase * 2);
        if (Math.abs(this.velocity.x) < 0.1) offset = 1;
        for (const limb of this.limbSystem.limbs) {
            limb.origin.y = -offset;
        }
        //console.log(this.limbSystem.limbGroups[0].passingPhase);

        this.pixelLayer.sprite.x = (this.position.x - this.pixelLayer.renderTexture.width / 2) * 4;
        this.pixelLayer.sprite.y = (this.position.y - this.pixelLayer.renderTexture.height / 2) * 4;
        this.pixelLayer.render();

        this.graphics.clear();
        //this.graphics.ellipse(0, 0, this.playerHitbox.radiusX, this.playerHitbox.radiusY);
        //this.graphics.fill(0xff0000);

        this.graphics.position = new Vector(32, 32 - offset);

        this.graphics.circle(0, -17, 3);
        this.graphics.fill(0x4477aa);
        this.graphics.moveTo(0, offset);
        this.graphics.lineTo(0, -14);
        this.graphics.moveTo(-1, 0);
        this.graphics.lineTo(-2, -12);
        this.graphics.lineTo(2, -12);
        this.graphics.lineTo(1, 0);
        this.graphics.stroke({ color: 0x4477aa, width: 2 });
        this.legGraphics.clear();
        for (const limb of this.limbSystem.limbs) {
            this.legGraphics.moveTo(limb.origin.x, limb.origin.y);
            this.legGraphics.lineTo(limb.joint.x, limb.joint.y);
            this.legGraphics.lineTo(limb.end.x, limb.end.y);
            let vec = limb.end.result();
            vec.add(limb.target.result().sub(limb.end).normalize(4));
            this.legGraphics.lineTo(vec.x, vec.y);
            //let col = limb.group == this.limbSystem.limbGroups[1] ? 0xff0000 : 0x0000ff;
            this.legGraphics.stroke({ color: 0x4477aa, width: 2 });
            if (limb.moving) {
                this.legGraphics.circle(limb.target.x, limb.target.y, 3);
                this.legGraphics.stroke({ color: 0xffff00, width: 1 });
            }
        }
        this.legGraphics.circle(this.limbSystem.limbGroups[0].target.x, this.limbSystem.limbGroups[0].target.y, 2);
        this.legGraphics.stroke({ color: 0x00ff00, width: 1 });

        this.legGraphics.circle(this.limbSystem.limbGroups[0].target.x, this.limbSystem.limbGroups[0].target.y - 5, 1);
        this.legGraphics.stroke({ color: 0x00ff00, width: 1 });

        this.legGraphics.circle(this.limbSystem.limbGroups[0].target.x, this.limbSystem.limbGroups[0].target.y + 5, 1);
        this.legGraphics.stroke({ color: 0x00ff00, width: 1 });

    }
}
