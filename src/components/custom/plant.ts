import { Color, Graphics } from "pixi.js";
import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { ParticleText } from "../../hierarchy/particleText";
import { Vector } from "../../utils/vector";
import { Prefab } from "../../hierarchy/prefabs";
import { clamp, lerp, RandomGenerator } from "../../utils/utils";
import { CustomColor } from "../../utils/color";
import { PlantSpecies } from "../../plants/plantSpecies";
import { PlantGenerator } from "../../plants/plantGenerator";
import { SurfaceMaterial, TerrainInspectMode } from "../../world/terrain";
import EntityTooltip from "../generic/entityTooltip";
import ShaderMeshRenderer from "../generic/shaderMeshRenderer";
import Planter, { IEvnironmentProvider } from "./planter";

declare module "../types" { interface ComponentRegistry { Plant: Plant } }
export default class Plant extends Component {
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
    bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    fullyGrown = false;
    inView = false;
    plantedIn?: Planter;
    storedCo2 = 0;
    plantedByPlayer = false;
    private tempPlantedIn?: number;


    constructor(parent: Entity) {
        super(parent);
        this.onEntity("update", (dt) => this.update(dt));
        this.graphics = new Graphics();
        this.randomSeed = Math.random() * 1000;
    }

    override init(): void {
        if (this.tempPlantedIn) this.plantedIn = game.activeScene.findEntity(this.tempPlantedIn)?.getComponent(Planter);
        if (this.species.generatorConstructor === undefined) throw new Error("co se doje?");
        this.generator = new this.species.generatorConstructor(this);
        this.tooltipComponent = this.entity.getComponent(EntityTooltip);
        if (this.tooltipComponent) this.tooltipComponent.tooltipName = this.species.name ?? "Tree";
        this.shaderMeshComponent = this.entity.getComponent(ShaderMeshRenderer)!;
        this.shaderMeshComponent.container.addChild(this.graphics);
        this.shaderMeshComponent.renderTexture.source.autoGarbageCollect = true;

        if (this.health > 0) {
            //game.score.add(100);
        }
        Plant.list.push(this);
        this.drawPlant();
    }

    override toData(): ComponentData {
        const data = { growth: this.growth, species: this.species.name, health: this.health } as Parameters<this["applyData"]>[0];
        if (this.plantedIn) data.plantedIn = this.plantedIn.entity.id;
        if (this.plantedByPlayer) data.plantedByPlayer = this.plantedByPlayer;
        return super.toData(data);
    }

    override applyData(data: { growth: number; species: string; health: number, plantedIn?: number, plantedByPlayer?: boolean }): void {
        this.growth = data.growth;
        this.health = data.health ?? 1;
        this.plantedByPlayer = data.plantedByPlayer ?? false;
        if (data.plantedIn) this.tempPlantedIn = data.plantedIn;
        //console.log(data.species);
        if (data.species) this.species = PlantSpecies.species.get(data.species)!;
    }


    get envirnonmentProvider(): IEvnironmentProvider {
        if (this.plantedIn != undefined) return this.plantedIn.environment;
        return {
            atmo: game.atmo,
            terrain: game.terrain
        }
    }

    update(realDt: number) {
        const plantSimulationSpeed = 10;

        const dt = realDt * plantSimulationSpeed;

        const bounds = this.bounds;
        const minBox = { x: bounds.minX, y: bounds.minY };
        const maxBox = { x: bounds.maxX, y: bounds.maxY };

        if (game.camera.inViewX(this.transform.position.x) || game.camera.inViewBox(this.transform.position, minBox, maxBox, 50)) {
            if (!this.inView) {
                this.setCullVisible(true);
                this.inView = true;
                this.drawPlant();
                this.timeSinceDraw = 0;
                return;
            }
            this.timeSinceDraw += realDt;
            //Debug.log(this.timeSinceDraw);
            if (this.timeSinceDraw > this.secondsPerDraw && !this.dead) {
                this.timeSinceDraw = 0;
                this.drawPlant();
            }
        }
        else {
            this.setCullVisible(false);
            this.inView = false;
        }
        if (!this.entity.components.has(this.id) || this.shaderMeshComponent == undefined) return;
        if (this.dead) {
            if (this.storedCo2 > 0) {
                const releasedCo2 = Math.min(this.storedCo2, (this.storedCo2 + .01) * dt * .02);
                this.envirnonmentProvider.atmo.co2 += releasedCo2;
                this.storedCo2 -= releasedCo2;
                if (this.storedCo2 <= 0) {
                    this.storedCo2 = 0;
                    if (this.plantedByPlayer) {
                        this.entity.remove();
                        return;
                    }
                }
                //Debug.log("released co2: " + releasedCo2);
            }
            return;
        }
        if (this.health <= 0) {
            //if already dead
            this.damage(1, "unknown reasons");
            return;
        }
        let tdata = this.envirnonmentProvider.terrain.getProperties(this.transform.position.x);
        let adata = this.envirnonmentProvider.atmo.getProperties(this.transform.position.x);
        if (this.tooltipComponent) {
            this.tooltipComponent.enabled = game.terrain.inspectMode != TerrainInspectMode.none;
            this.tooltipComponent.tooltipName = this.species.name;
            this.tooltipComponent.tooltipData.set("Health", parseFloat(this.health.toFixed(2)).toString());
            this.tooltipComponent.tooltipData.set("Growth", parseFloat(this.growth.toFixed(2)).toString());
            //seed
            this.tooltipComponent.tooltipData.set("Seed Progress", parseFloat(this.seedProgress.toFixed(2)).toString());
            //this.tooltipComponent.tooltipData.set("species", this.species.name);
        }
        if (tdata == undefined) return;
        if (adata.pollution > 0) {
            this.damage(dt * adata.pollution * .002 * this.species.statsPerTime.pollutionDamage, "air pollution");
            if (this.dead) return;
            if (this.health > .1) {
                adata.pollution = Math.max(0, adata.pollution - dt * this.species.statsPerTime.pollution * .0001 * this.growth);
            }
            this.shaderMeshComponent.renderMesh.tint = new Color({ r: 255, g: this.health * 255, b: this.health * 255, a: 1 });
        }
        if (tdata.fertility > 0 && tdata.moisture > .1 && this.health > .1) {
            //grow if fert and moist
            let addedGrowth = dt * Math.min(tdata.fertility, tdata.moisture) * .2;
            let usedGrowth = 0;
            if (this.health < 1) {
                //heal if needed
                this.health = Math.min(1, this.health + .03 * addedGrowth);
                usedGrowth += addedGrowth * .8;
                addedGrowth *= this.health * .2;
            }
            if (this.growth < this.species.statsPerGrowth.maxGrowth) {
                //grow if under max
                this.growth += addedGrowth;
                game.score.add(addedGrowth);
                usedGrowth += addedGrowth;
                if (this.growth >= this.species.statsPerGrowth.maxGrowth) {
                    this.growth = this.species.statsPerGrowth.maxGrowth;
                    if (!this.fullyGrown) {
                        this.fullyGrown = true;
                        game.events.emit("plantGrow", this);
                    }
                }
            }
            else if (this.health >= 1 && this.growth >= this.species.statsPerGrowth.maxGrowth && this.seedProgress <= this.nextseed) {
                //seed if over max
                this.seedProgress += addedGrowth;
                usedGrowth += addedGrowth;
            }
            this.envirnonmentProvider.terrain.consumeFertility(this.transform.position.x, usedGrowth * this.species.statsPerGrowth.nutrients * 3);
            const capturedCo2 = usedGrowth * this.species.statsPerGrowth.co2 * .1;
            this.storedCo2 += capturedCo2;
            this.envirnonmentProvider.atmo.co2 -= capturedCo2;
            this.envirnonmentProvider.atmo.co2 = clamp(this.envirnonmentProvider.atmo.co2, 200, 800);
            this.envirnonmentProvider.terrain.fixErosion(this.transform.position.x + Math.random() * 60, usedGrowth * this.species.statsPerGrowth.erosion * .002);
            this.envirnonmentProvider.terrain.removeMoisture(this.transform.position.x, usedGrowth * this.species.statsPerGrowth.water * .0025);
        }
        if (this.health > 0) {
            let requiredMoisture = dt * this.species.statsPerTime.water * (this.growth + 2) * .000025;
            if (tdata.moisture < requiredMoisture) {
                this.damage((requiredMoisture - tdata.moisture) * 8 * clamp(1 - (this.growth / this.species.statsPerGrowth.maxGrowth), .2, 1), "lack of water");
            }
            else {
                this.envirnonmentProvider.terrain.addGrass(this.transform.position.x, this.species.statsPerTime.grassiness * .01 * dt * this.growth / this.species.statsPerGrowth.maxGrowth);
            }
            this.envirnonmentProvider.terrain.removeMoisture(this.transform.position.x, requiredMoisture);
        }
        if (this.seedProgress >= this.nextseed * 0.1 && !this.plantedIn) {
            this.nextseed *= 2;
            let potentialSeedPositions = [];
            let seedValidArray = [];
            for (let i = 0; i < 5; i++) {
                potentialSeedPositions[i] = this.transform.position.x + (2 * Math.random() - .5) * (100 + i * 40);
                seedValidArray[i] = true;
            }
            //console.log(potentialSeedPositions);
            for (const plant of Plant.list) {
                if (plant.dead) continue;
                let avoidRadius = 40;
                if (plant.species == this.species) avoidRadius = 80;
                if (this.species.name == "Vetiver grass") avoidRadius = 20;
                for (let i = 0; i < potentialSeedPositions.length; i++) {
                    if (!seedValidArray[i]) continue;
                    if (Math.abs(plant.entity.transform.position.x - potentialSeedPositions[i]) < avoidRadius) {
                        seedValidArray[i] = false;
                        //new ParticleText("seed blocked", new Vector(potentialSeedPositions[i], this.transform.position.y - 40));
                    }
                }
            }
            let validSeed = seedValidArray.indexOf(true);
            if (validSeed != -1) {
                let newPlant = Prefab.Plant({ species: this.species.name, scene: this.entity.scene });
                new ParticleText("seed", this.transform.position.clone().add(new Vector(0, -40)));
                newPlant.transform.position.x = potentialSeedPositions[validSeed];
                newPlant.transform.position.y = this.transform.position.y;
            }
        }
        //this.shaderMeshComponent.renderMesh.scale.set(Math.sqrt(this.growth) * .3);
    }

    damage(amount: number, reason: string) {
        amount = Math.min(.9, amount);
        const oldHealth = this.health;
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0 && !this.dead) {
            this.health = 0;
            this.dead = true;
            this.drawPlant();
            if (oldHealth > 0) {
                new ParticleText("died from " + reason, this.transform.position.clone().add(new Vector(0, -40)));
                console.log("died with co2 " + this.storedCo2);
            }
            if (this.tooltipComponent) {
                //this.tooltipComponent.tooltipData.set("status", "died from " + reason);
                this.tooltipComponent.tooltipData.clear();
                this.tooltipComponent.enabled = false;
            }
        }
    }

    static branch(options: BranchOptions) {
        const random = options.random;
        let angle = options.angle;
        let length = options.length;
        let thickness = options.thickness;
        let pos = options.position;
        let growth = options.growth;
        let branchProbability = .4;
        let branchAngleRandomness = .6;
        let growthAngleRandomness = .2;
        let leavesRadius = 1;
        let growthBranchMultiplier = .5;
        if (options.species.name === "Sea buckthorn") {
            branchProbability = .6;
            thickness *= .5;
            leavesRadius = 1.5;
            branchAngleRandomness = 1;
            growthAngleRandomness = .4;
            growthBranchMultiplier = .8;
        }
        const color = options.species.generatorData.leaves ? CustomColor.randomAroundHSL(random, 20, 5, 0.3, 0.1, 0.3, 0.1).toPixi() : CustomColor.randomAroundHSL(random, 130 * options.health, 10, 0.4 * options.health + .3, 0.2, 0.3, 0.05).toPixi();
        for (let i = 0; i < growth; i++) {
            let remainingGrowth = growth - i;
            let radius = remainingGrowth * .2 + 1 * thickness;
            const newRandom = random.child();
            if (remainingGrowth > 2 && newRandom.float() < branchProbability) {
                let angleOffset = (newRandom.float() - .5) * branchAngleRandomness * Math.PI;
                thickness = Math.max(2, thickness);
                if (i > growth * .2) {
                    this.branch({ angle: angle + angleOffset, length: length, position: pos.clone(), random: newRandom, thickness: thickness / 2, growth: remainingGrowth * growthBranchMultiplier, species: options.species, graphics: options.graphics, health: options.health });
                }
                angle -= angleOffset;
                thickness /= 2;
            }
            angle += (random.float() - .5) * growthAngleRandomness * Math.PI;
            //move angle towards default
            angle = lerp(angle, -Math.PI / 2, .15);
            options.graphics.moveTo(pos.x, pos.y);
            const lengthMult = Math.min(1, remainingGrowth);
            pos.add(Vector.fromAngle(angle).mult(length * lengthMult));
            options.graphics.lineTo(pos.x, pos.y);
            options.graphics.stroke({ color: color, width: radius });
            options.graphics.circle(pos.x, pos.y, radius / 2);
            options.graphics.fill(color);
        }
        const leavesRandom = random.child();
        if (growth > 1 && options.species.generatorData.leaves) {
            const offset = 5 + growth * .08;
            for (let i = 0; i < 3 + growth * 2; i++) {
                const xOff = leavesRandom.range(-offset, offset);
                const yOff = leavesRandom.range(-offset, offset);
                if (leavesRandom.float() < options.health)
                    options.graphics.circle(pos.x + xOff, pos.y + yOff, 2.5 * options.health);
            }
            const color = CustomColor.randomAroundHSL(leavesRandom, 130 * options.health, 10, 0.4 * options.health + .3, 0.2, 0.3, 0.05).toPixi();
            options.graphics.fill(color);
        }
    }

    drawPlant() {
        let hit = game.collisionSystem.raycast(this.entity.transform.position.clone().add({ x: 0, y: -1000 }), this.entity.transform.position.clone().add({ x: 0, y: 1000 }), (body) => { return body.userData?.material == SurfaceMaterial.dirt });
        if (hit) {
            this.entity.transform.position.y = hit.point.y;
        }
        if (this.plantedIn) this.entity.transform.position.x = this.plantedIn.transform.position.x;
        Plant.plantGraphics({ graphics: this.graphics, species: this.species, growth: this.growth, randomSeed: this.randomSeed, health: this.health });
        this.shaderMeshComponent.draw();
        this.bounds = this.shaderMeshComponent.renderMesh.getLocalBounds();
    }

    static plantGraphics(options: { graphics: Graphics; species: PlantSpecies, growth: number, randomSeed: number, health: number }) {
        options.graphics.clear();
        const branchAmount = Math.max(1, Math.min(options.growth * 5, options.species.generatorData.initialBranches));
        let x = 0;
        const random = new RandomGenerator(options.randomSeed);
        for (let i = 0; i < branchAmount; i++) {
            this.branch({
                growth: options.growth,
                angle: -Math.PI / 2,
                length: options.species.generatorData.lengthPerGrowth,
                position: new Vector(x, 0),
                random: random.child(),
                thickness: 1,
                graphics: options.graphics,
                species: options.species,
                health: options.health
            });
            x = random.int(-10, 10);
        }
        return options.graphics;
    }

    remove() {
        Plant.list.splice(Plant.list.indexOf(this), 1);
        super.remove();
    }

    setCullVisible(visible: boolean) {
        if (this.tooltipComponent != undefined && this.health > 0)
            this.tooltipComponent.enabled = visible;
        this.shaderMeshComponent.renderMesh.visible = visible;
        this.shaderMeshComponent.renderMesh.shader.enabled = visible;
        if (!visible) {
            //this.shaderMeshComponent.renderTexture.source.unload();
            this.graphics.clear();
        }
        else {
        }
    }

    static list: Plant[] = [];

}

type BranchOptions = {
    health: number;
    graphics: Graphics;
    species: PlantSpecies;
    growth: number;
    random: RandomGenerator;
    position: Vector;
    angle: number;
    length: number;
    thickness: number;
}


