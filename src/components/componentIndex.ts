import { Component } from "../hierarchy/component";
import { Button } from "./custom/button";
import { Door } from "./custom/door";
import { Plant } from "./custom/plant";
import { BasicSprite } from "./generic/basicSprite";
import { Hitbox } from "./generic/hitbox";
import { Interactable } from "./generic/interactable";
import { Pollution } from "./generic/pollution";
import { RoboLogic } from "./generic/roboLogic";
import { ShaderMeshRenderer } from "./generic/shaderMeshRenderer";
import { SpriteDirection } from "./generic/spriteDirection";
import { EntityTooltip } from "./generic/entityTooltip";
import { Transform } from "./generic/transfrom";
import { WindowRenderer } from "./generic/windowRenderer";
import { LightComponent } from "./generic/lightComponent";
import { BiocharKiln } from "./custom/biocharKiln";
import { TerrainAlign } from "./generic/terrainAlign";
import { Trigger } from "./generic/trigger";
import { Planter } from "./custom/planter";
import { Inventory } from "./generic/inventory";
import { AnimatedSpriteRenderer } from "./generic/animatedSprite";
import { TalkComponent } from "./generic/talk";


export function initComponents(){
    Component.register(RoboLogic);
    Component.register(BasicSprite);
    Component.register(Transform);
    Component.register(SpriteDirection);
    Component.register(Interactable);
    Component.register(Door);
    Component.register(Plant);
    Component.register(Hitbox);
    Component.register(Pollution);
    Component.register(Button);
    Component.register(EntityTooltip);
    Component.register(ShaderMeshRenderer);
    Component.register(WindowRenderer);
    Component.register(LightComponent);
    Component.register(BiocharKiln);
    Component.register(TerrainAlign);
    Component.register(Trigger);
    Component.register(Planter);
    Component.register(Inventory);
    Component.register(AnimatedSpriteRenderer);
    Component.register(TalkComponent);
}