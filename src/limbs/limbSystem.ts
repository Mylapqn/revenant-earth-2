import { Vector } from "../vector";
import { Limb } from "./limb";
import { LimbGroup } from "./limbGroup";

export class LimbSystem {
    limbs: Limb[] = [];
    limbGroups: LimbGroup[] = [];
    origin:Vector = new Vector(0,0);
    update(dt: number, origin: Vector, retargetLegs: boolean = true) {
        let moved = this.origin.result().diff(origin);
        this.origin = origin.result();
        for (const group of this.limbGroups) {
            group.update(dt,retargetLegs ? moved.result(): new Vector(0,0));
        }
    }
    addGroup(offset:Vector, maxDistance: number) {
        let lg = new LimbGroup(this, offset.result(),maxDistance);
        this.limbGroups.push(lg);
        return lg;
    }
}
