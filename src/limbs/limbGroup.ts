import { game } from "../game";
import { Vector } from "../utils/vector";
import { Limb } from "./limb";
import { LimbSystem } from "./limbSystem";

export class LimbGroup {
    limbs: Limb[] = [];
    system: LimbSystem;
    target: Vector = new Vector(0, 0);
    minLimbsStand = 1;
    maxDistance = 100;
    passingPhase = 0;

    constructor(system: LimbSystem, offset: Vector, maxDistance: number) {
        this.system = system;
        this.target = offset.result();
        this.maxDistance = maxDistance;
    }
    update(dt: number, moved: Vector) {
        let actualTarget = this.target.result();
        //This produces wrong results for moving left because it doesn't remember the direction
        if (moved.x > 10 * dt) actualTarget.x *= -1;
        let hit = game.collisionSystem.raycast(actualTarget.result().add(this.system.origin).add({ x: 0, y: -5 }), actualTarget.result().add(this.system.origin).add({ x: 0, y: 5 }));
        if (hit) actualTarget.y = hit.point.y - this.system.origin.y;
        //if(hit) console.log(hit.point);
        let groundedLimbs = 0;
        let tooFarAwayLimbs = 0;
        let farthestLimb: Limb | null = null;
        let farthestDistance = 0;
        this.passingPhase = 0;
        for (const limb of this.limbs) {
            this.passingPhase += Math.max(0, Math.min(1, (1 - (Math.abs(limb.ratioRemaining - 0.7) * 2)) * 3));
            if (!limb.moving) limb.end.add(moved);
            limb.update(dt);
            if (!limb.moving) groundedLimbs++;
            let dist = limb.end.distanceSquared(actualTarget);
            if (dist > this.maxDistance) {
                tooFarAwayLimbs++;
                if (dist > farthestDistance) {
                    farthestDistance = dist;
                    farthestLimb = limb;
                }
            }
        }
        this.passingPhase = this.passingPhase * this.passingPhase * (3 - 2 * this.passingPhase);
        if ((tooFarAwayLimbs === this.limbs.length || farthestDistance > this.maxDistance * 10) && farthestLimb && groundedLimbs > this.minLimbsStand) {
            farthestLimb.startStep(actualTarget.result());
            groundedLimbs--;
        }
    }
    addLimb(offset: Vector, jointHeight?: number) {
        let l = new Limb(this, offset, jointHeight);
        this.limbs.push(l);
        this.system.limbs.push(l);
        return l;
    }
}