import { Graphics } from "pixi.js";
import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { Vectorlike } from "../../utils/vector";
import { AtmoData } from "../../world/atmo";
import { Terrain, TerrainData } from "../../world/terrain";

export class Planter extends Component {
    static componentType = "Planter";
    constructor(entity: Entity) {
        super(entity);
        this.mockEnvironment();
        this.onEntity("update", (dt) => this.update(dt));
    }

    terrainData: TerrainData = { pollution: 0, fertility: 1, erosion: 0.9, moisture: 0.3 };
    atmoData: AtmoData = { pollution: 0 };

    override toData(): ComponentData {
        const data = { terrainData: this.terrainData, atmoData: this.atmoData } as Parameters<this["applyData"]>[0];
        return super.toData(data);
    }

    override applyData(data: { terrainData?: TerrainData, atmoData?: AtmoData }): void {
        if (data.terrainData) {
            this.terrainData = data.terrainData;
        }
        if (data.atmoData) {
            this.atmoData = data.atmoData;
        }
        this.mockEnvironment();
    }

    readonly radius = 25;

    update(dt: number) {
        if (this.transform.position.distanceSquared(game.worldMouse) < this.radius ** 2) {
            if (game.input.key("x")) {
                const data = this.environment.terrain.getProperties(game.worldMouse.x);
                data.fertility = Math.min(1, data.fertility + 0.1);
                //data.moisture = Math.min(1, data.moisture + 0.1);
            }
        }
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

}

export interface IAtmoEvnironmentProvider {
    getProperties(x: number | Vectorlike): AtmoData
    co2: number
}