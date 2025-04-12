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
    static Tree(params: PrefabTreeParams) {
        let newtree = Entity.fromData(
            {
                kind: "Entity",
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
                        componentType:"EntityTooltip"
                    }
                ],
            },
            params.scene ?? game.activeScene
        );

        newtree.transform.position.set(params.x ?? params.position?.x ?? 0, params.y ?? params.position?.y ?? 0);
        return newtree;
    }
}
