import { Assets, Color, Graphics, Texture } from "pixi.js";
import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { BasicSprite } from "../generic/BasicSprite";
import { ParticleText } from "../../hierarchy/particleText";
import { Vector } from "../../vector";
import { Prefab } from "../../hierarchy/prefabs";
import { FoliageMesh } from "../../shaders/foliageMesh";
import { TooltipComponent } from "../generic/tooltipComponent";
import { ShaderMeshComponent } from "../generic/ShaderMeshComponent";
import { lerp, RandomGenerator } from "../../utils";
import { CustomColor } from "../../color";
import { PlantSpecies } from "../../plants/plantSpecies";

export class Tree extends Component {
    static componentType = "Tree";
    growth = 0;
    health = 1;
    shaderMeshComponent!: ShaderMeshComponent;
    tooltipComponent?: TooltipComponent
    nextseed = 20;
    graphics: Graphics;
    secondsPerDraw = 1;
    timeSinceDraw = 1000;
    randomSeed = 0;
    species: PlantSpecies = new PlantSpecies("Default", { co2: 0, nutrients: 0, biomass: 0, water: 0, erosion: 0 }, { pollution: 0, water: 0 });

    constructor(parent: Entity) {
        super(parent);
        this.onEntity("update", (dt) => this.update(dt));
        this.graphics = new Graphics();
        this.randomSeed = Math.random() * 1000;
    }

    override init(): void {
        this.tooltipComponent = this.entity.getComponent(TooltipComponent);
        if (this.tooltipComponent) this.tooltipComponent.tooltipName = "Tree";
        this.shaderMeshComponent = this.entity.getComponent(ShaderMeshComponent)!;
        this.shaderMeshComponent?.container.addChild(this.graphics);
        this.drawTree();
    }

    override toData(): ComponentData {
        const data = { growth: this.growth, species: this.species.name };
        return super.toData(data);
    }

    override applyData(data: { growth: number; species: string }): void {
        this.growth = data.growth;
        console.log(data.species);
        if (data.species) this.species = PlantSpecies.species.get(data.species)!;
    }

    update(dt: number) {
        this.timeSinceDraw += dt;
        if (this.timeSinceDraw > this.secondsPerDraw && this.health > 0.01) {
            this.timeSinceDraw = 0;
            this.drawTree();
        }
        if (!this.entity.components.has(this.id) || this.shaderMeshComponent == undefined) return;
        let tdata = game.terrain.getProperties(this.transform.position.x);
        let adata = game.atmo.getProperties(this.transform.position.x);
        if (this.tooltipComponent) {
            this.tooltipComponent.tooltipData.set("treeHealth", parseFloat(this.health.toFixed(2)).toString());
            this.tooltipComponent.tooltipData.set("treeGrowth", parseFloat(this.growth.toFixed(2)).toString());
            //pollution fertility
            this.tooltipComponent.tooltipData.set("pollution", parseFloat(tdata.pollution.toFixed(2)).toString());
            this.tooltipComponent.tooltipData.set("fertility", parseFloat(tdata.fertility.toFixed(2)).toString());
            this.tooltipComponent.tooltipData.set("species", this.species.name);
        }
        if (tdata == undefined) return;
        if (tdata.pollution > 0) {
            this.health = Math.max(0, this.health - dt * tdata.pollution * .1);
            if (this.health > .1) {
                tdata.pollution = Math.max(0, tdata.pollution - dt * this.species.statsPerTime.pollution * .1);
            }
            this.shaderMeshComponent.renderMesh.tint = new Color({ r: 255, g: this.health * 255, b: this.health * 255, a: 1 });
        }
        if (this.health < 1) {
            this.health = Math.min(1, this.health + dt * .01);
        }
        if (tdata.fertility > 0) {
            let addedGrowth = dt * this.health * tdata.fertility * 2;
            this.growth += addedGrowth;
            tdata.fertility -= addedGrowth * this.species.statsPerGrowth.nutrients;
            adata.co2 -= addedGrowth * this.species.statsPerGrowth.co2;
        }
        if (this.nextseed < this.growth) {
            this.nextseed = this.growth + 1;
            let newtree = Prefab.Tree({ species: this.species.name, scene: this.entity.scene });
            new ParticleText("seed", this.transform.position.result().add(new Vector(0, -40)));
            newtree.transform.position.x = this.transform.position.x + (80 * Math.random() - 40) * 10;
            newtree.transform.position.y = this.transform.position.y;
        }
        //this.shaderMeshComponent.renderMesh.scale.set(Math.sqrt(this.growth) * .3);
    }

    branch(options: BranchOptions) {
        const random = options.random;
        let angle = options.angle;
        let length = options.length;
        let thickness = options.thickness;
        let pos = options.position;
        let growth = options.growth;
        const color = CustomColor.randomAroundHSL(random, 20, 5, 0.3, 0.1, 0.3, 0.1).toPixi();

        for (let i = 0; i < growth; i++) {
            let remainingGrowth = growth - i;
            let radius = remainingGrowth * .2 + 1 * thickness;
            if (i > growth * .2 && remainingGrowth > 2 && random.float() < .4) {
                let angleOffset = (Math.random() - .5) * .6 * Math.PI;
                thickness = Math.max(2, thickness);
                this.branch({ angle: angle + angleOffset, length: length, position: pos.result(), random: random, thickness: thickness / 2, growth: remainingGrowth * .5 });
                angle -= angleOffset;
                thickness /= 2;
            }
            angle += (random.float() - .5) * .2 * Math.PI;
            //move angle towards default
            angle = lerp(angle, -Math.PI / 2, .15);
            this.graphics.moveTo(pos.x, pos.y);
            pos.add(Vector.fromAngle(angle).mult(length));
            this.graphics.lineTo(pos.x, pos.y);
            this.graphics.stroke({ color: color, width: radius });
            this.graphics.circle(pos.x, pos.y, radius / 2);
            this.graphics.fill(color);
        }
        if (growth > 1 && this.species.generatorData.leaves) {
            const offset = 5;
            this.graphics.circle(pos.x, pos.y + offset, (2 + growth * .3) * this.health);
            this.graphics.circle(pos.x, pos.y - offset, (2 + growth * .3) * this.health);
            this.graphics.circle(pos.x + offset, pos.y, (2 + growth * .3) * this.health);
            this.graphics.circle(pos.x - offset, pos.y, (2 + growth * .3) * this.health);
            const color = CustomColor.randomAroundHSL(random, 130 * this.health, 10, 0.4 * this.health + .3, 0.2, 0.3, 0.05).toPixi();
            this.graphics.fill(color);
        }
    }

    drawTree() {
        this.graphics.clear();
        const branchAmount = Math.max(1, Math.min(this.growth*5, this.species.generatorData.initialBranches));
        let x = 0;
        const random = new RandomGenerator(this.randomSeed);
        for (let i = 0; i < branchAmount; i++) {
            this.branch({
                growth: this.growth,
                angle: -Math.PI / 2,
                length: this.species.generatorData.lengthPerGrowth,
                position: new Vector(x, 0),
                random: random,
                thickness: 1
            });
            x = random.int(-10, 10);
        }

        //this.graphics.lineTo(0, -this.growth * 20);
        //this.graphics.stroke({ color: 0x773300, width: this.growth });
        //let y = -this.growth * 15;
        //for (let i = 1; i <= this.growth; i++) {
        //    let radius = (this.growth - i + 1) * 5
        //    this.graphics.circle(0, y, radius);
        //    y -= radius
        //}
        //this.graphics.stroke({ color: 0x449900, width: 2 });
        //this.graphics.fill(0x338800);
        this.shaderMeshComponent.draw();
    }

}

type BranchOptions = {
    growth: number;
    random: RandomGenerator;
    position: Vector;
    angle: number;
    length: number;
    thickness: number;
}