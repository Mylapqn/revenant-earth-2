import { game } from "../../game";
import { Component } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { ParticleText } from "../../hierarchy/particleText";
import { sleep } from "../../utils/utils";
import { Vector } from "../../utils/vector";
import Plant from "./plant";

declare module "../types" { interface ComponentRegistry { BiocharKiln: BiocharKiln } }
export default class BiocharKiln extends Component {
    static componentType = "BiocharKiln";
    constructor(entity: Entity) {
        super(entity);
        this.onEntity("update", (dt) => this.update(dt));
        this.onEntity("interact", () => this.kiln());
    }
    update(dt: number) {
    }

    //override toData(): ComponentData {
    //    const data = {}
    //    return super.toData(data);
    //}
    //
    //override applyData(data: {}): void {
    //    //get all plants in radius
    //    super.applyData(data);
    //}

    async kiln() {
        const range = 200;
        const plantsInRadius: Plant[] = [];
        game.activeScene.findComponents(Plant).forEach(plant => {
            const dist = plant.transform.position.distance(this.transform.position)
            if (dist < range) plantsInRadius.push(plant);
        })
        //console.log("biochar kiln");
        //console.log(plantsInRadius);

        console.log(this.transform.position);
        //remove all plants
        new ParticleText(`processed ${plantsInRadius.length} plants`, this.transform.position.clone().add(new Vector(0, -50)));
        for (const plant of plantsInRadius) {
            const tdata = plant.envirnonmentProvider.terrain.getProperties(this.transform.position.x + Math.random() * range);
            //refund a bit of fertility for each plant
            tdata.fertility = Math.min(1, tdata.fertility + plant.storedCo2 * 0.05 + 0.01);
            plant.entity.remove();
            game.score.addWithFx(90 * plant.health + 10, game.camera.worldToRender(plant.transform.position));
            await sleep(100);
        }
    }
}