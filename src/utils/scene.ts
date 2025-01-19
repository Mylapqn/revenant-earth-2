import { IEntity } from "./entity";
import { ISerializable } from "./serialise";

export class Scene {
    objects = new Set<IEntity>();
    serialisable = new Set<ISerializable>();
    
}