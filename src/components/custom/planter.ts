import { Assets, Graphics } from "pixi.js";
import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { Vector, Vectorlike } from "../../utils/vector";
import { AtmoData } from "../../world/atmo";
import { SurfaceMaterial, Terrain, TerrainData, TerrainInspectMode } from "../../world/terrain";
import { Box, SATVector } from "detect-collisions";
import { Debug } from "../../dev/debug";
import { BasicSprite } from "../generic/basicSprite";
import { CustomColor } from "../../utils/color";

type PartialData = { terrainData?: Partial<TerrainData>, atmoData?: Partial<AtmoData> };

export class Planter extends Component {
    static componentType = "Planter";
    collider!: Box;
    basicSprite!: BasicSprite;
    inspectMode: TerrainInspectMode = TerrainInspectMode.none;
    keepStats: PartialData = {};
    private _enabled = true;
    public get enabled() {
        return this._enabled;
    }
    public set enabled(value) {
        this._enabled = value;
        if (this.collider)
            this.collider.userData.material = value ? SurfaceMaterial.dirt : SurfaceMaterial.metal;
    }
    constructor(entity: Entity) {
        super(entity);
        this.mockEnvironment();
        this.onEntity("update", (dt) => this.update(dt));
    }

    terrainData: TerrainData = { pollution: 0, fertility: 1, erosion: 0.9, moisture: 0.3,grassiness:0 };
    atmoData: AtmoData = { pollution: 0 };

    override toData(): ComponentData {
        const data = { terrainData: this.terrainData, atmoData: this.atmoData, keepStats: this.keepStats } as Parameters<this["applyData"]>[0];
        return super.toData(data);
    }

    override applyData(data: { terrainData?: TerrainData, atmoData?: AtmoData, keepStats?: PartialData }): void {
        if (data.terrainData) {
            this.terrainData = data.terrainData;
        }
        if (data.atmoData) {
            this.atmoData = data.atmoData;
        }
        this.keepStats = data.keepStats ?? {};
        this.mockEnvironment();

    }

    override init(): void {
        const dimensions = { x: 50, y: 24 };
        this.collider = game.collisionSystem.createBox(new Vector(-dimensions.x / 2, -dimensions.y / 2), dimensions.x, dimensions.y, { userData: { material: SurfaceMaterial.dirt } });
        this.basicSprite = this.entity.getComponent(BasicSprite)!;
    }

    readonly radius = 30;

    remove(): void {
        game.collisionSystem.remove(this.collider);
        super.remove();
    }

    update(dt: number) {
        this.collider.setOffset(new SATVector(this.transform.position.x, this.transform.position.y));
        if (this.transform.position.distanceSquared(game.worldMouse) < this.radius ** 2) {
            if (game.input.key("x")) {
                const data = this.environment.terrain.getProperties(game.worldMouse.x);
                data.fertility = Math.min(1, data.fertility + 0.1);
                //data.moisture = Math.min(1, data.moisture + 0.1);
            }
        }
        if (game.terrain.inspectMode != this.inspectMode) this.setInspect();
        if (this.inspectMode != TerrainInspectMode.none) {
            let inspect = this.environment.terrain.getProperties(0)[Terrain.inspectModes[this.inspectMode] as keyof TerrainData];
            if (this.inspectMode == TerrainInspectMode.pollution || this.inspectMode == TerrainInspectMode.erosion) inspect = 1 - inspect;
            this.setTint(inspect);
        }
        else {
            this.basicSprite.sprite.tint = CustomColor.gray(200 * (1 - this.environment.terrain.getProperties(0).moisture) + 55).toPixi();
        }
        if (this.keepStats) {
            if (this.keepStats.terrainData) this.terrainData = Object.assign(this.terrainData, this.keepStats.terrainData);
            if (this.keepStats.atmoData) this.atmoData = Object.assign(this.atmoData, this.keepStats.atmoData);
        }

    }

    setInspect() {
        this.inspectMode = game.terrain.inspectMode;
        if (this.inspectMode != TerrainInspectMode.none) {
            this.basicSprite.sprite.texture = Assets.get("planter_inspect");
        }
        else {
            this.basicSprite.sprite.texture = Assets.get("planter");
            this.basicSprite.sprite.tint = 0xffffff;
        }
    }

    setTint(value: number) {
        let color = CustomColor.fromShader([1 - value, value, .1]).normalize();
        this.basicSprite.sprite.tint = color.toPixi();
    }

    debugDraw(graphics: Graphics): void {
        graphics.circle(this.transform.position.x, this.transform.position.y, this.radius);
        graphics.stroke({ color: 0x55ff99, width: .25 });
        //Debug.containerWorldspace.addChild(text);
    }

    mockEnvironment() {
        this.environment = {
            terrain: {
                getProperties: (x: number | Vectorlike) => this.terrainData,
                consumeFertility(x, filterRate, limit) {
                    return Terrain.prototype.consumeFertility.call(this, x, filterRate, limit);
                },
                fixErosion(x, value) {
                    return Terrain.prototype.fixErosion.call(this, x, value);
                },
                removeMoisture(x, value) {
                    return Terrain.prototype.removeMoisture.call(this, x, value);
                },
                addGrass(x, value) {
                    return Terrain.prototype.addGrass.call(this, x, value);
                }

            }, atmo: {
                getProperties: (x: number | Vectorlike) => this.atmoData,
                co2: 0
            }
        };
    }

    environment!: IEvnironmentProvider;
}


export interface IEvnironmentProvider {
    terrain: ITerrainEvnironmentProvider,
    atmo: IAtmoEvnironmentProvider
}


export interface ITerrainEvnironmentProvider {
    getProperties(x: number | Vectorlike): TerrainData
    consumeFertility(x: number | Vectorlike, filterRate: number, limit?: number): number
    fixErosion(x: number | Vectorlike, value: number): void
    removeMoisture(x: number | Vectorlike, value: number): void
    addGrass(x: number | Vectorlike, value: number): void

}

export interface IAtmoEvnironmentProvider {
    getProperties(x: number | Vectorlike): AtmoData
    co2: number
}