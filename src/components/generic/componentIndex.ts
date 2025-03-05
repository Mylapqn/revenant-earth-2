import { Component } from "../../hierarchy/component";
import { Interactable } from "./interactable";
import { RoboLogic } from "./roboLogic";
import { BasicSprite } from "./BasicSprite";
import { SpriteDirectionComponent } from "./spriteDirectionComponent";
import { Transform } from "./transfrom";
import { Door } from "../custom/door";
import { Tree } from "../custom/tree";
import { HitboxComponent } from "./HitboxComponent";

export function initComponents(){
    Component.register(RoboLogic);
    Component.register(BasicSprite);
    Component.register(Transform);
    Component.register(SpriteDirectionComponent);
    Component.register(Interactable);
    Component.register(Door);
    Component.register(Tree);
    Component.register(HitboxComponent);
    
}