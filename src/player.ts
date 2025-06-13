import { Body, Ellipse } from "detect-collisions";
import { Game, game } from "./game";
import { Assets, Graphics, Matrix, Sprite, Spritesheet } from "pixi.js";
import { Vector, Vectorlike } from "./utils/vector";
import { PixelLayer } from "./pixelRendering/pixelLayer";
import { LimbSystem } from "./limbs/limbSystem";
import { ISerializable, StateMode } from "./hierarchy/serialise";
import { Scene } from "./hierarchy/scene";
import { Atmo } from "./world/atmo";
import { UIProgressBar } from "./ui/progressBar";
import { LegSystem } from "./limbs/legSystem";
import { Debug } from "./dev/debug";
import { displayNumber, limitAbs } from "./utils/utils";
import { DynamicAnimatedSprite } from "./pixelRendering/dynamicAnimatedSprite";
import { Shadowmap } from "./shaders/lighting/shadowmap";
import { CustomColor } from "./utils/color";
import { Lightmap } from "./shaders/lighting/lightmap";
import { SurfaceMaterial } from "./world/terrain";

export class Player implements ISerializable {
    position = new Vector(1100, -50);
    initialPosition = new Vector(1100, -50);
    sprite: Sprite;
    playerHitbox: Ellipse;
    graphics: Graphics;
    legGraphics: Graphics;
    velocity = new Vector();
    pixelLayer: PixelLayer;
    get grounded() {
        return this.groundedTimer > 0;
    }
    groundedTimer = 0;
    materialUnder: SurfaceMaterial = SurfaceMaterial.metal;

    health = 100;
    oxygen = 100;

    statsDisplay: HTMLDivElement;
    healthBar: UIProgressBar;
    oxygenBar: UIProgressBar;
    animatedSprite: DynamicAnimatedSprite;

    footstepProgress = 0;

    constructor() {
        this.statsDisplay = document.createElement("div");
        document.body.appendChild(this.statsDisplay);
        this.statsDisplay.classList.add("stats");

        this.healthBar = new UIProgressBar("Health", this.statsDisplay);
        this.oxygenBar = new UIProgressBar("Oxygen", this.statsDisplay);

        game.activeScene.register(this);
        this.pixelLayer = new PixelLayer({ width: 64, height: 64, autoRender: true, parent: game.playerContainer, worldSpace: false });
        this.animatedSprite = new DynamicAnimatedSprite(Assets.get("player_anim") as Spritesheet);
        this.animatedSprite.anchor.set(0.5, 0.5);
        this.animatedSprite.scale.set(1);
        this.animatedSprite.position.set(32);

        this.graphics = new Graphics();
        this.legGraphics = new Graphics();
        this.legGraphics.position = new Vector(32, 32);

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
        this.playerHitbox = game.collisionSystem.createEllipse({ x: 0, y: 0 }, 8, 24);

        this.sprite = new Sprite();
        this.sprite.anchor.set(0.5);
        this.sprite.position.set(32, 32);
        //this.pixelLayer.container.pivot.set(32,64);
        //player.scale.set(4);
        this.sprite.scale.x *= -1;
        //game.pixelLayer.container.addChild(this.graphics);
        this.pixelLayer.container.addChild(this.graphics);
        //this.pixelLayer.container.addChild(this.sprite);
        this.pixelLayer.container.addChild(this.legGraphics);
        this.pixelLayer.addChild(this.animatedSprite);
    }

    respawn() {
        this.position = this.initialPosition.clone();
        this.velocity.set(0, 0);
        this.health = 100;
        this.oxygen = 100;
    }

    update(dt: number) {
        //Debug.log(this.position.y);
        const tdata = game.terrain.getProperties(this.position.x);
        const adata = game.atmo.getProperties(this.position.x);

        this.oxygen -= (adata.pollution - .5) * dt * 10;
        this.oxygen = Math.max(0, Math.min(100, this.oxygen));

        if (this.oxygen <= 0) this.health -= dt * 10 * adata.pollution;

        this.health = Math.max(0, Math.min(100, this.health));


        this.healthBar.progress = (this.health / 100);
        this.oxygenBar.progress = (this.oxygen / 100);
        //console.log(Atmo.displayValues(game.atmo.getProperties(this.position)));

        let maxSpeed = 60;
        let accel = 1000;
        let jumpSpeed = 300;
        let input = new Vector(0, 0);
        let sprint = false;
        if (game.inputEnabled) {
            if (game.input.key("d")) input.x += 1;
            if (game.input.key("a")) input.x -= 1;
            if (game.input.key(" ") || game.input.key("w")) input.y += 1;
            if (game.input.key("s")) input.y -= 1;

            sprint = !game.input.key("shift");
            if (sprint) {
                maxSpeed *= 2;
                accel *= 2;
            }
        }
        input.clamp(-1, 1);
        if (this.grounded)
            this.footstepProgress += Math.abs(input.x) * dt * 1.5 * (sprint ? 1.5 : 1);
        if (this.footstepProgress > 1) {
            this.footstepProgress = 0;
            let footstepType = "dirt";
            switch (this.materialUnder) {
                case SurfaceMaterial.dirt:
                    footstepType = "dirt"
                    break;
                case SurfaceMaterial.metal:
                    footstepType = "metal"
                    break;
                default:
                    break;
            }
            game.soundManager.playOneshot("footstep_" + footstepType);
        }
        if (input.x == 0) {
            this.footstepProgress = .4;
            if (this.grounded) this.velocity.x *= 1 - dt * 100;
            this.animatedSprite.swapAnimation("idle");
            this.animatedSprite.animationSpeed = .1;
            this.animatedSprite.scale.x = game.input.mouse.position.x > game.camera.worldToScreen(this.position).x ? 1 : -1;
        }
        else {
            this.animatedSprite.swapAnimation("run");
            this.animatedSprite.animationSpeed = sprint ? .15 : .1;
            this.animatedSprite.scale.x = input.x;
            if (input.x > 0 && this.velocity.x < maxSpeed || input.x < 0 && this.velocity.x > -maxSpeed) {
                this.velocity.x += accel * dt * input.x;
            }
            if (this.velocity.x > maxSpeed) this.velocity.x = maxSpeed;
            if (this.velocity.x < -maxSpeed) this.velocity.x = -maxSpeed;
        }
        if (input.y > 0 && this.grounded) {
            this.velocity.y = -jumpSpeed;
            this.groundedTimer = 0;
        }
        if (!this.grounded) {
            this.velocity.y += 1000 * dt;
            if (this.groundedTimer < -.1) {

                //this.animatedSprite.swapAnimation("jump_sprint");
            }
        }
        if (game.activeScene.hasTerrain) {
            if (this.position.x < 400) this.velocity.x += (400 - this.position.x);
            if (this.position.x > game.terrain.totalWidth - 400) this.velocity.x -= (this.position.x - (game.terrain.totalWidth - 400)) * 1;
            if (this.position.y > 500) this.respawn();
        }
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;

        this.playerHitbox.setPosition(this.position.x, this.position.y);
        this.playerHitbox.updateBody(true);

        this.groundedTimer -= dt;
        this.graphics.clear();
        game.collisionSystem.checkOne(this.playerHitbox, (response) => {
            this.materialUnder = (response.b as Body).userData.material;
            if (response.overlapV.y > 0) {
                //colliding with ground
                this.groundedTimer = 0.1;
                if (this.velocity.y > 200) this.footstepProgress = 2
                this.velocity.y = 0;
            }
            else {
                //colliding with ceiling
                response.overlapV.y -= .1;
                response.overlapV.x += Math.sign(response.overlapV.x);
                if (Math.sign(this.velocity.x) == Math.sign(response.overlapV.x)) this.velocity.x *= -.1;
                if (Math.sign(this.velocity.y) == Math.sign(response.overlapV.y)) this.velocity.y *= -.1;
            }
            if (Math.abs(this.velocity.x) < 20)
                this.velocity.x -= limitAbs(response.overlapV.x, 2);
            this.position.x -= response.overlapV.x;
            this.position.y -= response.overlapV.y;
            this.playerHitbox.setPosition(this.position.x, this.position.y);
            this.playerHitbox.updateBody(true);
            /* this.graphics.moveTo(0, 0);
            this.graphics.lineTo(response.overlapN.x * 10, response.overlapN.y * 10);
            this.graphics.stroke({ color: 0xffffff, width: 1 }); */
        });

        //console.log(this.limbSystem.limbGroups[0].passingPhase);
        this.pixelLayer.renderMesh.x = (this.position.x - this.pixelLayer.renderTexture.width / 2) * Game.pixelScale;
        this.pixelLayer.renderMesh.y = (this.position.y - this.pixelLayer.renderTexture.height / 2) * Game.pixelScale;
        this.pixelLayer.render();
        this.animatedSprite.tint = game.ambience.ambientColor().add(CustomColor.gray(game.activeScene.hasTerrain ? 0 : 200)).toPixi();

        this.graphics.position.set(32, 32);

        const shadowEnabled = false;
        if (shadowEnabled)
            game.app.renderer.render({ container: this.pixelLayer.renderMesh, target: Shadowmap.occluderTexture, transform: new Matrix().translate((this.pixelLayer.renderMesh.x - game.camera.position.x) / 4 + game.camera.pixelScreen.x / 2, (this.pixelLayer.renderMesh.y - game.camera.position.y) / 4 + game.camera.pixelScreen.y / 2), clear: false });

    }

    serialise(mode: StateMode): false | PlayerData {
        return { kind: "Player", position: this.position, velocity: this.velocity };
    }

    static deserialise(data: PlayerData, scene?: Scene) {
        game.player.position.set(data.position.x, data.position.y);
        game.player.velocity.set(data.velocity.x, data.velocity.y);
        if (scene) scene.register(game.player);
    }
}

export type PlayerData = { kind: "Player"; position: Vectorlike; velocity: Vectorlike };
