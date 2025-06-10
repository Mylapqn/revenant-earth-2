import { game } from "../game";
import { Entity } from "./entity";
import { Scene } from "./scene";

export type PrefabParams = {
    position?: { x: number; y: number };
    x?: number;
    y?: number;
    scene?: Scene;
};
export type PrefabTreeParams = { species: string } & PrefabParams;
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
                            growth: 1,
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
                    }
                ],
            },
            params.scene ?? game.activeScene
        );

        newEntity.transform.position.set(params.x ?? params.position?.x ?? 0, params.y ?? params.position?.y ?? 0);
        return newEntity;
    }
}
