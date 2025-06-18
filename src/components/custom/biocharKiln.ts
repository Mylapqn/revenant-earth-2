import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { ParticleText } from "../../hierarchy/particleText";
import { sleep } from "../../utils/utils";
import { Vector } from "../../utils/vector";
import { Plant } from "./plant";

export class BiocharKiln extends Component {
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
        const plantsInRadius: Plant[] = [];
        game.activeScene.findComponents(Plant).forEach(plant => {
            const dist = plant.transform.position.distance(this.transform.position)
            if (dist < 200) plantsInRadius.push(plant);
        })
        //console.log("biochar kiln");
        //console.log(plantsInRadius);

        console.log(this.transform.position);
        //remove all plants
        new ParticleText(`processed ${plantsInRadius.length} plants`, this.transform.position.clone().add(new Vector(0, -50)));
        for (const plant of plantsInRadius) {
            plant.entity.remove();
            game.score.addWithFx(100, game.camera.worldToRender(plant.transform.position));
            await sleep(100);    
        }
    }
}