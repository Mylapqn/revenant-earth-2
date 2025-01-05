import { Vector } from "../vector";
import { LimbGroup } from "./limbGroup";

export class Limb {
    origin: Vector = new Vector(0, 0);
    end: Vector = new Vector(0, 0);
    joint: Vector = new Vector(0, 0);
    target: Vector = new Vector(0, 0);
    group:LimbGroup;
    moving = false;
    jointLength = 10;
    distToMove = 0;
    constructor(group:LimbGroup, offset: Vector, jointHeight: number = 10) {
        this.group = group;
        this.target = offset.result();
        this.end = offset.result();
        this.jointLength = jointHeight;
    }
    update(dt: number) {
        if (this.moving) {
            //if (this.end.distance(this.origin) > this.jointLength*2.1) this.end = this.origin.result().sub(this.origin.result().diff(this.end).normalize(this.jointLength*2));
            if (this.end.distance(this.origin) > this.jointLength * 3) this.end = this.target.result();
            let moveDiff = this.target.result().diff(this.end);
            let moveDist = moveDiff.length();
            let moveDir = moveDiff.result().mult(1/moveDist);
            let ratioRemaining = this.distToMove / moveDist;
            if (moveDist < 1) {
                this.moving = false;
                this.end = this.target.result();
            }
            else {
                this.end.add(moveDir.result().mult(Math.min(moveDist, (160 * dt))));
                if (ratioRemaining > .5) this.end.y -= dt * 10;
                //else this.end.y+=dt*10;
            }
        }
        else if (this.end.distance(this.origin) > this.jointLength * 2.1) {
            this.end = this.origin.result().sub(this.origin.result().diff(this.end).normalize(this.jointLength * 2));
        }

        let diff = this.end.result().diff(this.origin);
        let midPoint = Vector.lerp(this.origin, this.end, .4).result();
        let dist = diff.length() / 2;
        let jointScale = Math.sqrt(this.jointLength * this.jointLength - dist * dist);
        if (!jointScale) jointScale = 0;
        let perpendicular = new Vector(diff.y, -diff.x).normalize(jointScale * (this.target.x < 0 ? -1 : 1));
        this.joint = midPoint.result().add(perpendicular);
        //this.joint = new Vector(-diff.y, diff.x);
    }
    startStep(target: Vector) {
        this.moving = true;
        this.target = target;
        this.distToMove = this.end.distance(target);
    }
}