import { Graphics } from "pixi.js";
import { Vector } from "../utils/vector";
import { game } from "../game";
import { Debug } from "../dev/debug";

export class LegSystem {
    origin: Vector = new Vector(0, 0);
    private leftLeg: Leg;
    private rightLeg: Leg;
    legs: [Leg, Leg];
    direction: number = 1; // -1 = left, 1 = right
    constructor() {
        this.leftLeg = new Leg(this, new Vector(1, 0));
        this.rightLeg = new Leg(this, new Vector(-2, 0));
        this.legs = [this.leftLeg, this.rightLeg];
    }
    draw(graphics: Graphics) {
        for (const leg of this.legs) {
            graphics.moveTo(leg.origin.x, leg.origin.y);
            graphics.lineTo(leg.knee.x, leg.knee.y);
            graphics.stroke({ color: 0xffaa00, width: 1 });
            graphics.lineTo(leg.end.x, leg.end.y);
            graphics.stroke({ color: 0xaa00ff, width: 1 });
            graphics.rect(leg.moveTarget.x, leg.moveTarget.y, 1, 1);
            graphics.fill(0xffff00);
            graphics.rect(leg.target.x, leg.target.y, 1, 1);
            graphics.fill(0xffff00);
        }
        graphics.moveTo(0, -10);
        graphics.lineTo(this.direction * 10, -10);
        graphics.stroke({ color: 0xff0000, width: 1 });
    }
    update(dt: number, origin: Vector, input: Vector) {
        const moved = this.origin.diff(origin);
        this.origin = origin.clone();
        const vel = moved.clone().mult(1 / dt);
        for (let i = 0; i < this.legs.length; i++) {
            const leg = this.legs[i];
            const otherLeg = this.legs[1 - i];
            if(!leg.moving){
                leg.target.add(moved);
            }
            //const predictedOtherLegX = otherLeg.target.x + vel.x * 100;
            //if (!leg.moving && !otherLeg.moving && Math.sign(leg.target.x) == Math.sign(predictedOtherLegX)) {
            //    const moveTarget = new Vector(this.direction * 10, 20);
            //    const actualTarget = moveTarget.clone().add(this.origin);
            //    let hit = game.collisionSystem.raycast(actualTarget, actualTarget.clone().add({ x: 0, y: 16 }));
            //    if (hit) {
            //        moveTarget.y = hit.point.y - this.origin.y;
            //    }
            //    leg.step(moveTarget);
            //    //console.log(moveTarget);
            //}
        }
        this.leftLeg.update(dt);
        this.rightLeg.update(dt);
    }
}

export class Leg {
    origin: Vector;
    knee: Vector;
    end: Vector;
    target: Vector;
    system: LegSystem;
    jointLength: number;
    moveTarget: Vector;
    moving = false;
    constructor(system: LegSystem, offset: Vector, jointLength = 8) {
        this.system = system;
        this.origin = offset.clone();
        this.knee = offset.clone().add(new Vector(0, jointLength));
        this.end = offset.clone().add(new Vector(0, jointLength * 2));
        this.moveTarget = this.end.clone();
        this.target = this.end.clone();
        this.jointLength = jointLength;
    }
    update(dt: number) {
        //if (this.moving) {
        //    this.target.add(this.moveTarget.diff(this.target).normalize(10 * dt));
        //    if (this.target.distance(this.moveTarget) < 10) {
        //        this.moving = false;
        //        this.target = this.moveTarget.clone();
        //    }
        //}

        //set endpoint and calculate stretch
        const length = this.target.diff(this.origin).length();
        let lengthDiff = Math.min(Math.max(length - this.jointLength * 2, 0), 2);
        let jointLengthStretch = Math.floor(this.jointLength + lengthDiff / 2);
        this.end.set(this.target.clone().sub(this.origin));
        if (length > jointLengthStretch * 2) this.end.normalize(jointLengthStretch * 2);
        this.end.add(this.origin);
        Debug.log(this.end.x);
        Debug.log(this.target.x);

        //set knee
        let diff = this.end.diff(this.origin);
        let dist = diff.length() / 2;
        let jointScale = Math.sqrt(this.jointLength * this.jointLength - dist * dist);
        if (!jointScale) jointScale = 0;
        let perpendicular = new Vector(diff.y, -diff.x).normalize(jointScale * (this.system.direction));
        this.knee = Vector.lerp(this.origin, this.end, .5).add(perpendicular);
    }
    step(target: Vector) {
        this.moveTarget = target;
        this.moving = true;
    }
}