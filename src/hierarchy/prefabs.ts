import { WellDefinedComponentData } from "../components/componentIndex";
import { SprinklerCore } from "../components/custom/sprinklerCore";
import { game } from "../game";
import { Entity } from "./entity";
import { Scene } from "./scene";

export type PrefabParams = {
    position?: { x: number; y: number };
    x?: number;
    y?: number;
    scene?: Scene;
};
export type PrefabTreeParams = { species: string, growth?: number, health?: number } & PrefabParams;
export class Prefab {
    static Plant(params: PrefabTreeParams) {
        let newtree = Entity.fromData(
            {
                kind: "Entity",
                name: "Plant",
                component: [
                    {
                        componentType: "ShaderMesh",
                    },
                    {
                        componentType: "Plant",
                        data: {
                            species: params.species,
                            growth: params.growth ?? 1,
                            health: params.health ?? 1
                        },
                    },
                    {
                        componentType: "EntityTooltip"
                    }
                ],
            },
            params.scene ?? game.activeScene
        );

        newtree.transform.position.set(params.x ?? params.position?.x ?? 0, params.y ?? params.position?.y ?? 0);
        return newtree;
    }

    static BiocharKiln(params: PrefabParams) {
        let newEntity = Entity.fromData(
            {
                kind: "Entity",
                name: "Biochar Kiln",
                component: [
                    {
                        componentType: "BasicSprite",
                        data: {
                            asset: "biochar",
                        },
                    },
                    {
                        componentType: "BiocharKiln",
                        data: {

                        }
                    },
                    {
                        componentType: "EntityTooltip"
                    },
                    {
                        componentType: "Interactable",
                    },
                    {
                        componentType: "TerrainAlign",
                        data: {
                            yOffset: 20
                        }
                    }
                ],
            },
            params.scene ?? game.activeScene
        );

        newEntity.transform.position.set(params.x ?? params.position?.x ?? 0, params.y ?? params.position?.y ?? 0);
        return newEntity;
    }

    static Rock(params: PrefabParams & { type: number }) {
        let newEntity = Entity.fromData(
            {
                kind: "Entity",
                name: "Rock",
                component: [
                    {
                        componentType: "BasicSprite",
                        data: {
                            asset: "./gfx/rocks/rock_" + params.type + ".png",
                        },
                    },
                    {
                        componentType: "TerrainAlign",
                        data: {
                            yOffset: 2
                        }
                    }
                ],
            },
            params.scene ?? game.activeScene
        );

        newEntity.transform.position.set(params.x ?? params.position?.x ?? 0, params.y ?? params.position?.y ?? 0);
        return newEntity;
    }


    static SprinklerCore(params: PrefabParams) {
        let newEntity = Entity.fromData(
            {
                kind: "Entity",
                name: "SprinklerCore",
                component: [
                    {
                        componentType: "BasicSprite",
                        data: {
                            asset: "./gfx/building/water_tank.png",
                        },
                    },
                    {
                        componentType: "SprinklerCore",
                        data: {}
                    },
                    { componentType: "Power" },
                    {
                        componentType: "TerrainAlign",
                        data: {
                            yOffset: 26
                        }
                    },
                    {
                        componentType: "Interactable",
                    },
                    {
                        componentType: "EntityTooltip",
                    }
                ],
            },
            params.scene ?? game.activeScene
        );

        newEntity.transform.position.set(params.x ?? params.position?.x ?? 0, params.y ?? params.position?.y ?? 0);
        return newEntity;
    }

    static SprinklerParts(params: PrefabParams & { core?: Entity }) {

        let parentData = {};
        if (params.core) {
            parentData = {
                sprinklerCore: params.core.id
            }
        }

        let newEntity = Entity.fromData(
            {
                kind: "Entity",
                name: "Sprinkler",
                component: [
                    {
                        componentType: "BasicSprite",
                        data: {
                            asset: "./gfx/building/water_sprinkler.png",
                        },
                    },
                    {
                        componentType: "Sprinkler",
                        data: {
                            ...parentData
                        }
                    },
                    {
                        componentType: "TerrainAlign",
                        data: {
                            yOffset: 16
                        }
                    }
                ],
            },
            params.scene ?? game.activeScene
        );

        newEntity.transform.position.set(params.x ?? params.position?.x ?? 0, params.y ?? params.position?.y ?? 0);
        return newEntity;
    }

    static SprinklerArray(params: PrefabParams) {
        const parts: Array<Entity> = [];
        const core = Prefab.SprinklerCore(params);
        parts.push(core);
        for (let i = -1; i < 2; i++) {
            const part = Prefab.SprinklerParts({ ...params, x: core.transform.position.x + (i * 30 * 3), core: core });
            parts.push(part);
        }

        return parts;
    }

    static Battery(params: PrefabParams) {
        let newEntity = Entity.fromData(
            {
                kind: "Entity",
                name: "Battery",
                component: [
                    {
                        componentType: "BasicSprite",
                        data: {
                            asset: "vite.svg",
                        },
                    },
                    {
                        componentType: "EntityTooltip",
                        data: {
                            tooltipName: "Battery"
                        }
                    },
                    {
                        componentType: "Power",
                        data: { capacity: 100 }
                    }
                ],
            },
            params.scene ?? game.activeScene
        );

        newEntity.transform.position.set(params.x ?? params.position?.x ?? 0, params.y ?? params.position?.y ?? 0);
        return newEntity;
    }


    static Planter(params: PrefabParams) {
        let newEntity = Entity.fromData(
            {
                kind: "Entity",
                name: "Planter",
                component: [
                    {
                        componentType: "BasicSprite",
                        data: {
                            asset: "planter",
                        },
                    },
                    {
                        componentType: "Planter",
                        data: {}
                    }
                ],
            },
            params.scene ?? game.activeScene
        );

        newEntity.transform.position.set(params.x ?? params.position?.x ?? 0, params.y ?? params.position?.y ?? 0);
        return newEntity;
    }

    static SolarPanel(params: PrefabParams) {
        let newEntity = Entity.fromData(
            {
                kind: "Entity",
                name: "Solar Panel",
                component: [
                    {
                        componentType: "BasicSprite",
                        data: {
                            asset: "window.png",
                        },
                    },
                    {
                        componentType: "SolarPanel",
                    },
                                        {
                        componentType: "EntityTooltip",
                        data: {
                            tooltipName: "Solar Panel"
                        } 
                    },
                    {
                        componentType: "Power",
                        data: { capacity: 1 }
                    }
                ],
            },
            params.scene ?? game.activeScene
        );

        newEntity.transform.position.set(params.x ?? params.position?.x ?? 0, params.y ?? params.position?.y ?? 0);
        return newEntity;
    }

    static Chest(params: PrefabParams) {
        let newEntity = Entity.fromData(
            {
                kind: "Entity",
                name: "Chest",
                component: [
                    {
                        componentType: "BasicSprite",
                        data: {
                            asset: "oxygenator1.png",
                        },
                    },
                    {
                        componentType: "Inventory",
                        data: {}
                    },
                    {
                        componentType: "LootComponent",
                    }
                ],
            },
            params.scene ?? game.activeScene
        );

        newEntity.transform.position.set(params.x ?? params.position?.x ?? 0, params.y ?? params.position?.y ?? 0);
        return newEntity;
    }
}
