import { game } from "./game";
import { Entity } from "./hierarchy/entity";
import { Scene } from "./hierarchy/scene";

export type PrefabParams = {
    position?: { x: number; y: number };
    x?: number;
    y?: number;
    scene?: Scene;
};
export type PrefabTreeParams = { asset: string } & PrefabParams;
export class Prefab {
    static Tree(params: PrefabTreeParams) {
        let newtree = Entity.fromData(
            {
                kind: "Entity",
                component: [
                    {
                        componentType: "BasicSprite",
                        data: {
                            asset: params.asset,
                        },
                    },
                    {
                        componentType: "Tree",
                        data: {
                            growth: 1,
                        },
                    },
                ],
            },
            params.scene ?? game.activeScene
        );

        newtree.transform.position.set(params.x ?? params.position?.x ?? 0, params.y ?? params.position?.y ?? 0);
        return newtree;
    }
}
