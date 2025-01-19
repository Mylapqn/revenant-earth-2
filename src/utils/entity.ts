import { Vectorlike } from "../vector";
import { Scene } from "./scene";

export interface IEntity {
    get position(): Vectorlike;
    scene?: Scene;
    unload(): void;
}


export class Entity implements IEntity {
    position: Vectorlike = { x: 0, y: 0 };
    scene?: Scene;
    unload(): void { }
}