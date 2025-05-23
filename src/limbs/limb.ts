import { game } from "../game";
import { Vector } from "../utils/vector";
import { LimbGroup } from "./limbGroup";

export class Limb {
    origin: Vector = new Vector(0, 0);
    end: Vector = new Vector(0, 0);
    joint: Vector = new Vector(0, 0);
    target: Vector = new Vector(0, 0);
    group: LimbGroup;
    moving = false;
    jointLength = 10;
    distToMove = 0;
    ratioRemaining = 0;
    constructor(group: LimbGroup, offset: Vector, jointHeight: number = 10) {
        this.group = group;
        this.target = offset.clone();
        this.end = offset.clone();
        this.jointLength = jointHeight;
    }
    update(dt: number) {
        if (this.moving) {
            //if (this.end.distance(this.origin) > this.jointLength*2.1) this.end = this.origin.result().sub(this.origin.result().diff(this.end).normalize(this.jointLength*2));
            if (this.end.distance(this.origin) > this.jointLength * 3) this.end = this.target.clone();
            let moveDiff = this.target.clone().diff(this.end);
            let moveDist = moveDiff.length();
            let moveDir = moveDiff.clone().mult(1 / moveDist);
            this.ratioRemaining = moveDist / this.distToMove;
            if (moveDist < 1) {
                this.ratioRemaining = 0;
                this.moving = false;
                this.end = this.target.clone();
                //game.sound.play("footstep-"+Math.floor(Math.random() * 5),{speed:1+Math.random()*.4});
                game.soundManager.playOneshot("footstep");
            }
            else {
                this.end.add(moveDir.clone().mult(Math.min(moveDist, (100 * dt))));
                if (this.ratioRemaining > .4) this.end.y -= dt * 50;
                //else this.end.y+=dt*10;
            }
        }
        else if (this.end.distance(this.origin) > this.jointLength * 2.1) {
            this.end = this.origin.clone().sub(this.origin.clone().diff(this.end).normalize(this.jointLength * 2));
        }

        let diff = this.end.clone().diff(this.origin);
        let midPoint = Vector.lerp(this.origin, this.end, .4).clone();
        let dist = diff.length() / 2;
        let jointScale = Math.sqrt(this.jointLength * this.jointLength - dist * dist);
        if (!jointScale) jointScale = 0;
        let perpendicular = new Vector(diff.y, -diff.x).normalize(jointScale * (this.target.x < 0 ? -1 : 1));
        this.joint = midPoint.clone().add(perpendicular);
        //this.joint = new Vector(-diff.y, diff.x);
    }
    startStep(target: Vector) {
        this.moving = true;
        this.target = target;
        this.distToMove = this.end.distance(target);
    }
}