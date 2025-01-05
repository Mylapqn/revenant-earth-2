import { game } from "../game";
import { Vector } from "../vector";
import { Limb } from "./limb";
import { LimbSystem } from "./limbSystem";

export class LimbGroup {
    limbs: Limb[] = [];
    system: LimbSystem;
    target: Vector = new Vector(0, 0);
    minLimbsStand = 1;
    maxDistance = 100;

    constructor(system: LimbSystem, offset: Vector, maxDistance: number) {
        this.system = system;
        this.target = offset.result();
        this.maxDistance = maxDistance;
    }
    update(dt: number, moved: Vector) {
        let actualTarget = this.target.result();
        if (moved.x > 0) actualTarget.x *= -1;
        let hit = game.collisionSystem.raycast(actualTarget.result().add(this.system.origin).add({ x: 0, y: -5 }), actualTarget.result().add(this.system.origin).add({ x: 0, y: 5 }));
        if (hit) actualTarget.y = hit.point.y - this.system.origin.y;
        let groundedLimbs = 0;
        let tooFarAwayLimbs = 0;
        let farthestLimb: Limb | null = null;
        let farthestDistance = 0;
        for (const limb of this.limbs) {
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
        if ((tooFarAwayLimbs === this.limbs.length || farthestDistance > this.maxDistance * 4) && farthestLimb && groundedLimbs > this.minLimbsStand) {
            farthestLimb.startStep(actualTarget);
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