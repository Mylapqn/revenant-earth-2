import { Assets, Color, Graphics, Texture } from "pixi.js";
import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { BasicSprite } from "../generic/basicSprite";
import { ParticleText } from "../../hierarchy/particleText";
import { Vector } from "../../utils/vector";
import { Prefab } from "../../hierarchy/prefabs";
import { EntityTooltip } from "../generic/entityTooltip";
import { ShaderMeshRenderer } from "../generic/shaderMeshRenderer";
import { clamp, lerp, RandomGenerator } from "../../utils/utils";
import { CustomColor } from "../../utils/color";
import { PlantSpecies } from "../../plants/plantSpecies";
import { PlantGenerator } from "../../plants/plantGenerator";
import { Debug } from "../../dev/debug";

export class Plant extends Component {
    static componentType = "Plant";
    growth = 0;
    health = 1;
    shaderMeshComponent!: ShaderMeshRenderer;
    tooltipComponent?: EntityTooltip
    nextseed = 1;
    seedProgress = 0;
    graphics: Graphics;
    secondsPerDraw = .5;
    timeSinceDraw = 1000;
    randomSeed = 0;
    dead = false;
    species!: PlantSpecies;
    generator!: PlantGenerator;

    constructor(parent: Entity) {
        super(parent);
        this.onEntity("update", (dt) => this.update(dt));
        this.graphics = new Graphics();
        this.randomSeed = Math.random() * 1000;
    }

    override init(): void {
        if (this.species.generatorConstructor === undefined) throw new Error("co se doje?");
        this.generator = new this.species.generatorConstructor(this);
        this.tooltipComponent = this.entity.getComponent(EntityTooltip);
        if (this.tooltipComponent) this.tooltipComponent.tooltipName = "Tree";
        this.shaderMeshComponent = this.entity.getComponent(ShaderMeshRenderer)!;
        this.shaderMeshComponent?.container.addChild(this.graphics);


        game.score.add(100);
        Plant.list.push(this);
        this.drawPlant();
    }

    override toData(): ComponentData {
        const data = { growth: this.growth, species: this.species.name, health: this.health };
        return super.toData(data);
    }

    override applyData(data: { growth: number; species: string; health: number }): void {
        this.growth = data.growth;
        this.health = data.health ?? 1;
        console.log(data.species);
        if (data.species) this.species = PlantSpecies.species.get(data.species)!;
    }

    update(realDt: number) {
        const plantSimulationSpeed = 10;

        const dt = realDt * plantSimulationSpeed;

        if (game.camera.inView(this.transform.position, 50)) {
            this.timeSinceDraw += realDt;
            //Debug.log(this.timeSinceDraw);
            if (this.timeSinceDraw > this.secondsPerDraw && !this.dead) {
                this.timeSinceDraw = 0;
                this.drawPlant();
            }
        }
        if (!this.entity.components.has(this.id) || this.shaderMeshComponent == undefined) return;
        if (this.dead) return;
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
        if (adata.pollution > 0) {
            this.damage(dt * adata.pollution * .02 * this.species.statsPerTime.pollutionDamage, "air pollution");
            if (this.health > .1) {
                adata.pollution = Math.max(0, adata.pollution - dt * this.species.statsPerTime.pollution * .02);
            }
            this.shaderMeshComponent.renderMesh.tint = new Color({ r: 255, g: this.health * 255, b: this.health * 255, a: 1 });
        }
        if (this.health < 1) {
            this.health = Math.min(1, this.health + dt * .001);
        }
        if (tdata.fertility > 0 && tdata.moisture > .1 && this.health > .1 && this.growth < this.species.statsPerGrowth.maxGrowth) {
            let addedGrowth = dt * this.health * Math.min(tdata.fertility, tdata.moisture) * .2;
            this.growth += addedGrowth;
            game.score.add(addedGrowth);
            tdata.fertility -= addedGrowth * this.species.statsPerGrowth.nutrients * .1;
            game.atmo.co2 -= addedGrowth * this.species.statsPerGrowth.co2;
            tdata.erosion -= addedGrowth * this.species.statsPerGrowth.erosion * .1;
            tdata.erosion = Math.max(0, tdata.erosion);
            tdata.moisture -= addedGrowth * this.species.statsPerGrowth.water * .1;
        }
        if (this.health > 0) {
            let requiredMoisture = dt * this.species.statsPerTime.water * this.growth * .05;
            if (tdata.moisture < requiredMoisture) {
                this.damage(requiredMoisture - tdata.moisture, "lack of water");
                tdata.moisture = 0;
            }
            else if (this.growth >= this.species.statsPerGrowth.maxGrowth) {
                this.seedProgress += dt * this.health * .1;
            }
        }
        if (this.seedProgress > this.nextseed) {
            this.nextseed *= 2;
            let seedPos = this.transform.position.x + (80 * Math.random() - 40) * 10;
            let seedValid = true;
            for (const plant of Plant.list) {
                if (Math.abs(plant.entity.transform.position.x - seedPos) < 5) {
                    seedValid = false;
                    break;
                }
            }
            if (seedValid) {
                let newtree = Prefab.Plant({ species: this.species.name, scene: this.entity.scene });
                new ParticleText("seed", this.transform.position.clone().add(new Vector(0, -40)));
                newtree.transform.position.x = seedPos;
                newtree.transform.position.y = this.transform.position.y;
            }
        }
        //this.shaderMeshComponent.renderMesh.scale.set(Math.sqrt(this.growth) * .3);
    }

    damage(amount: number, reason: string) {
        amount = Math.min(.9, amount);
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0 && !this.dead) {
            this.dead = true;
            this.drawPlant();
            new ParticleText("died from " + reason, this.transform.position.clone().add(new Vector(0, -40)));
            this.tooltipComponent?.tooltipData.clear();
            this.tooltipComponent?.tooltipData.set("status", "died from " + reason);
        }
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
                    this.branch({ angle: angle + angleOffset, length: length, position: pos.clone(), random: newRandom, thickness: thickness / 2, growth: remainingGrowth * .5 });
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

    drawPlant() {
        let hit = game.collisionSystem.raycast(this.entity.transform.position.clone().add({ x: 0, y: -200 }), this.entity.transform.position.clone().add({ x: 0, y: 200 }), (body) => { return body.userData?.terrain });
        if (hit) {
            this.entity.transform.position.y = hit.point.y;
        }
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

    remove() {
        Plant.list.splice(Plant.list.indexOf(this), 1);
        super.remove();
    }

    static list: Plant[] = [];

}

type BranchOptions = {
    growth: number;
    random: RandomGenerator;
    position: Vector;
    angle: number;
    length: number;
    thickness: number;
}