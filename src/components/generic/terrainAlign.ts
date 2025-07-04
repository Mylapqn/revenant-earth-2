import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { primitiveObject } from "../../hierarchy/serialise";

declare module "../types" { interface ComponentRegistry { TerrainAlign: TerrainAlign } }
export default class TerrainAlign extends Component {
    static componentType = "TerrainAlign";
    yOffset = 0;
    //accumulation = 0;
    inView = false;
    constructor(entity: Entity) {
        super(entity);
        this.onEntity("update", (dt) => this.update(dt));
    }
    applyData(data?: { yOffset: number }): void {
        this.yOffset = data?.yOffset || 0;
    }
    toData(data?: primitiveObject): ComponentData {
        data = { yOffset: this.yOffset };
        return super.toData(data);
    }
    remove(): void {
        this.entity.off("update", (dt) => this.update(dt));
        super.remove();
    }
    init() {
        this.align();
    }
    update(dt: number) {

        if (game.camera.inViewX(this.transform.position.x, 200)) {
            if (!this.inView) {
                this.align();
            }
            this.inView = true;
        }
        else {
            this.inView = false;
        }
    }
    align() {
        let hit = game.collisionSystem.raycast(this.entity.transform.position.clone().add({ x: 0, y: -1000 }), this.entity.transform.position.clone().add({ x: 0, y: 1000 }), (body) => { return body.userData?.terrain });
        if (hit) {
            this.entity.transform.position.y = hit.point.y - this.yOffset;
        }
    }
}