import { Assets, Texture } from "pixi.js";
import { game } from "../game";
import { PlantSpecies } from "../plants/plantSpecies";
import { Vector, Vectorlike } from "../utils/vector";
import { SurfaceMaterial } from "../world/terrain";
import { Entity } from "./entity";
import { Prefab } from "./prefabs";
import { Plant } from "../components/custom/plant";
import { Planter } from "../components/custom/planter";
import { Debug } from "../dev/debug";

export type ValidateResults = { valid: boolean, reason: string, warning?: string };
export type CheckResults = ValidateResults & { snap: Vectorlike };
export type BuildableOptions = {
    validatePosition?: (position: Vectorlike) => ValidateResults;
    onBuild: (position: Vectorlike) => Entity;
    allowedMaterials?: SurfaceMaterial[];
    drawGhost?: () => void
    texture?: Texture
    name: string
}

export class Buildable {
    validatePosition: (position: Vectorlike) => ValidateResults;
    onBuild: (position: Vectorlike) => Entity;
    texture?: Texture
    drawGhost = () => { if (this.texture) game.buildingGhost.renderImage(this.texture) };
    allowedMaterials: SurfaceMaterial[] = [];
    name: string
    constructor(options: BuildableOptions) {
        this.validatePosition = options.validatePosition ?? ((position: Vectorlike) => ({ valid: true, reason: "Can place here" }));
        this.onBuild = options.onBuild
        this.allowedMaterials = options.allowedMaterials ?? [SurfaceMaterial.dirt];
        this.drawGhost = options.drawGhost ?? this.drawGhost;
        this.texture = options.texture;
        this.name = options.name
        Buildable.database.set(this.name, this);
    }
    checkRaycast(position: Vectorlike) {
        let hit = game.collisionSystem.raycast(Vector.fromLike(position).add({ x: 0, y: -20 }), Vector.fromLike(position).add({ x: 0, y: 50 }), (body) => { return body.userData?.material != undefined && this.allowedMaterials.includes(body.userData.material) });
        const result: { valid: boolean, snap?: Vectorlike } = { valid: true };
        if (hit) {
            //console.log(hit);
            const centerY = hit.body.minY + (hit.body.maxY - hit.body.minY) / 2;
            if (centerY < hit.point.y) {
                result.valid = false;
            }
            else {
                result.valid = true;
                result.snap = hit.point;
            }
        }
        else {
            result.valid = false;
        }
        return result;
    }
    checkPosition(position: Vectorlike): CheckResults {
        const result = this.checkRaycast(position);
        if (!result.snap) result.snap = position;
        if (result.valid) {
            const validate = this.validatePosition(result.snap!);
            return { valid: validate.valid, reason: validate.reason, warning: validate.warning, snap: result.snap };
        }
        else return { valid: false, reason: "Invalid position", snap: result.snap };
    }

    static database: Map<string, Buildable> = new Map<string, Buildable>();

    static plantBuildable(species: PlantSpecies) {
        return new Buildable({
            allowedMaterials: [SurfaceMaterial.dirt],
            validatePosition: (position) => {
                const planter = game.activeScene.findComponent(Planter, (planter) => planter.transform.position.distanceSquared(position) < planter.radius ** 2);
                const tdata = planter ? planter.environment.terrain.getProperties(position.x) : game.terrain.getProperties(position.x);
                const snap = planter ? planter.transform.position.clone() : position;
                let reason = "Can place here";
                let warning = "";
                if (tdata.fertility < .5) warning += "Fertility too low\n";
                if (tdata.moisture < .5) warning += "Moisture too low\n";
                if (warning.length > 0) reason = "";
                return { valid: true, reason, warning };
            },
            onBuild: (position) => {
                const planter = game.activeScene.findComponent(Planter, (planter) => planter.transform.position.distanceSquared(position) < planter.radius ** 2);
                const plant = Prefab.Plant({ position: position, species: species.name, growth: 2 });
                plant.getComponent(Plant)!.plantedIn = planter ? planter : undefined;
                return plant;
            },
            drawGhost: () => {
                Plant.plantGraphics({ graphics: game.buildingGhost.graphics, species: species, growth: Math.min(15, species.statsPerGrowth.maxGrowth), randomSeed: Math.random() * 1000, health: 1 });
                game.buildingGhost.renderGraphics();
            },
            name: species.name
        });
    }


    activate() {
        game.buildingGhost.setEnabled(true);
        this.drawGhost();
        game.currentBuildable = this;
    }

    deactivate() {
        game.buildingGhost.setEnabled(false);
        game.currentBuildable = undefined;
    }

    static activate(name: string) {
        const buildable = Buildable.database.get(name);
        if (buildable) {
            buildable.activate();
        }
        if (!buildable) console.error("Buildable not found: " + name);
    }

    static async initBuildables() {
        new Buildable({
            name: "Sprinkler",
            onBuild: (position) => {
                const prefab = Prefab.SprinklerArray({ position: position, scene: game.activeScene })[0];
                return prefab;
            },
            texture: await Assets.load("./gfx/building/biochar.png"),
        });
        new Buildable({
            name: "Biochar Kiln",
            onBuild: (position) => {
                const prefab = Prefab.BiocharKiln({ position: position, scene: game.activeScene });
                return prefab;
            },
            texture: await Assets.load("./gfx/building/biochar.png"),
        });
        new Buildable({
            name: "Battery",
            onBuild: (position) => {
                const prefab = Prefab.Battery({ position: position, scene: game.activeScene });
                return prefab;
            },
            texture: await Assets.load("./gfx/building/biochar.png"),
        });

        new Buildable({
            name: "Solar Panel",
            onBuild: (position) => {
                const prefab = Prefab.SolarPanel({ position: position, scene: game.activeScene });
                return prefab;
            },
            texture: await Assets.load("./window.png"),
        });
    }
}