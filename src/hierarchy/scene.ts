import { Entity } from "./entity";
import { ISerializable } from "./serialise";

export class Scene {
    objects = new Set<Entity>();
    serialisable = new Set<ISerializable>();

}