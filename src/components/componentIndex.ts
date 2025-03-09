import { Component } from "../hierarchy/component";
import { Button } from "./custom/button";
import { Door } from "./custom/door";
import { Tree } from "./custom/tree";
import { BasicSprite } from "./generic/BasicSprite";
import { HitboxComponent } from "./generic/HitboxComponent";
import { Interactable } from "./generic/interactable";
import { PollutionComponent } from "./generic/PollutionComponent";
import { RoboLogic } from "./generic/roboLogic";
import { SpriteDirectionComponent } from "./generic/spriteDirectionComponent";
import { Transform } from "./generic/transfrom";


export function initComponents(){
    Component.register(RoboLogic);
    Component.register(BasicSprite);
    Component.register(Transform);
    Component.register(SpriteDirectionComponent);
    Component.register(Interactable);
    Component.register(Door);
    Component.register(Tree);
    Component.register(HitboxComponent);
    Component.register(PollutionComponent);
    Component.register(Button);
    
}