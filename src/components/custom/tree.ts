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
    nextseed = 1;
    seedProgress = 0;
    graphics: Graphics;
    secondsPerDraw = .5;
    timeSinceDraw = 1000;
    randomSeed = 0;
    species: PlantSpecies = new PlantSpecies("Default", { co2: 0, nutrients: 0, biomass: 0, water: 0, erosion: 0, maxGrowth: 0 }, { pollution: 0, pollutionDamage: 0, water: 0 }, { initialBranches: 0, lengthPerGrowth: 0, leaves: false });

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
            this.tooltipComponent.tooltipName = this.species.name;
            this.tooltipComponent.tooltipData.set("treeHealth", parseFloat(this.health.toFixed(2)).toString());
            this.tooltipComponent.tooltipData.set("treeGrowth", parseFloat(this.growth.toFixed(2)).toString());
            //pollution fertility
            this.tooltipComponent.tooltipData.set("pollution", parseFloat(tdata.pollution.toFixed(2)).toString());
            this.tooltipComponent.tooltipData.set("fertility", parseFloat(tdata.fertility.toFixed(2)).toString());
            //seed
            this.tooltipComponent.tooltipData.set("seedProgress", parseFloat(this.seedProgress.toFixed(2)).toString());
            //this.tooltipComponent.tooltipData.set("species", this.species.name);
        }
        if (tdata == undefined) return;
        if (tdata.pollution > 0) {
            this.health = Math.max(0, this.health - dt * tdata.pollution * .1 * this.species.statsPerTime.pollutionDamage);
            if (this.health > .1) {
                tdata.pollution = Math.max(0, tdata.pollution - dt * this.species.statsPerTime.pollution * .1);
            }
            this.shaderMeshComponent.renderMesh.tint = new Color({ r: 255, g: this.health * 255, b: this.health * 255, a: 1 });
        }
        if (this.health < 1) {
            this.health = Math.min(1, this.health + dt * .01);
        }
        if (tdata.fertility > 0 && tdata.moisture > 0 && this.growth < this.species.statsPerGrowth.maxGrowth) {
            let addedGrowth = dt * this.health * Math.min(tdata.fertility, tdata.moisture) * 2;
            this.growth += addedGrowth;
            tdata.fertility -= addedGrowth * this.species.statsPerGrowth.nutrients;
            game.atmo.co2 -= addedGrowth * this.species.statsPerGrowth.co2;
            tdata.erosion -= addedGrowth * this.species.statsPerGrowth.erosion * .1;
            tdata.erosion = Math.max(0, tdata.erosion);
            tdata.moisture -= addedGrowth * this.species.statsPerGrowth.water * .1;
        }
        if (this.health > 0) {
            let requiredMoisture = dt * this.species.statsPerTime.water * this.growth * .1;
            if (tdata.moisture < requiredMoisture) {
                this.health -= requiredMoisture - tdata.moisture;
                tdata.moisture = 0;
            }
            else if (this.growth >= this.species.statsPerGrowth.maxGrowth) {
                this.seedProgress += dt * this.health;
            }
        }
        if (this.seedProgress > this.nextseed) {
            this.nextseed *= 2;
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
        const color = this.species.generatorData.leaves ? CustomColor.randomAroundHSL(random, 20, 5, 0.3, 0.1, 0.3, 0.1).toPixi() : CustomColor.randomAroundHSL(random, 130 * this.health, 10, 0.4 * this.health + .3, 0.2, 0.3, 0.05).toPixi();
        for (let i = 0; i < growth; i++) {
            let remainingGrowth = growth - i;
            let radius = remainingGrowth * .2 + 1 * thickness;
            const newRandom = random.child();
            if (remainingGrowth > 2 && newRandom.float() < .4) {
                let angleOffset = (newRandom.float() - .5) * .6 * Math.PI;
                thickness = Math.max(2, thickness);
                if (i > growth * .2) {
                    this.branch({ angle: angle + angleOffset, length: length, position: pos.result(), random: newRandom, thickness: thickness / 2, growth: remainingGrowth * .5 });
                }
                angle -= angleOffset;
                thickness /= 2;
            }
            angle += (random.float() - .5) * .2 * Math.PI;
            //move angle towards default
            angle = lerp(angle, -Math.PI / 2, .15);
            this.graphics.moveTo(pos.x, pos.y);
            const lengthMult = Math.min(1, remainingGrowth);
            pos.add(Vector.fromAngle(angle).mult(length * lengthMult));
            this.graphics.lineTo(pos.x, pos.y);
            this.graphics.stroke({ color: color, width: radius });
            this.graphics.circle(pos.x, pos.y, radius / 2);
            this.graphics.fill(color);
        }
        const leavesRandom = random.child();
        if (growth > 1 && this.species.generatorData.leaves) {
            const offset = 5 + growth * .08;
            for (let i = 0; i < 3 + growth * 2; i++) {
                const xOff = leavesRandom.range(-offset, offset);
                const yOff = leavesRandom.range(-offset, offset);
                if (leavesRandom.float() < this.health)
                    this.graphics.circle(pos.x + xOff, pos.y + yOff, 2.5 * this.health);
            }
            const color = CustomColor.randomAroundHSL(leavesRandom, 130 * this.health, 10, 0.4 * this.health + .3, 0.2, 0.3, 0.05).toPixi();
            this.graphics.fill(color);
        }
    }

    drawTree() {
        this.graphics.clear();
        const branchAmount = Math.max(1, Math.min(this.growth * 5, this.species.generatorData.initialBranches));
        let x = 0;
        const random = new RandomGenerator(this.randomSeed);
        for (let i = 0; i < branchAmount; i++) {
            this.branch({
                growth: this.growth,
                angle: -Math.PI / 2,
                length: this.species.generatorData.lengthPerGrowth,
                position: new Vector(x, 0),
                random: random.child(),
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