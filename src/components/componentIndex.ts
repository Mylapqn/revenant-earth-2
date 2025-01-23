import { Component } from "../hierarchy/component";
import { EntitySerializer } from "./entitySerializer";
import { RoboLogic } from "./roboLogic";
import { BasicSprite } from "./spriteComponent";
import { SpriteDirectionComponent } from "./spriteDirectionComponent";
import { Transform } from "./transfrom";

export function initComponents(){
    Component.register(EntitySerializer);
    Component.register(RoboLogic);
    Component.register(BasicSprite);
    Component.register(Transform);
    Component.register(SpriteDirectionComponent);
    
}