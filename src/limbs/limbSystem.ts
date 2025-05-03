import { Vector } from "../utils/vector";
import { Limb } from "./limb";
import { LimbGroup } from "./limbGroup";

export class LimbSystem {
    limbs: Limb[] = [];
    limbGroups: LimbGroup[] = [];
    origin:Vector = new Vector(0,0);
    timeSinceUpdate = 0;
    update(dt: number, origin: Vector, retargetLegs: boolean = true) {
        this.timeSinceUpdate+= dt;
        if(this.timeSinceUpdate < 1/24) return;
        let moved = this.origin.clone().diff(origin);
        this.origin = origin.clone();
        for (const group of this.limbGroups) {
            group.update(this.timeSinceUpdate,retargetLegs ? moved.clone(): new Vector(0,0));
        }
        this.timeSinceUpdate = 0;
    }
    addGroup(offset:Vector, maxDistance: number) {
        let lg = new LimbGroup(this, offset.clone(),maxDistance);
        this.limbGroups.push(lg);
        return lg;
    }
}
