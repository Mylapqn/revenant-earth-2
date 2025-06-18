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
import { SprinklerCore } from "./custom/sprinklerCore";
import { Sprinkler } from "./custom/sprinkler";
import { AnimatedSpriteRenderer } from "./generic/animatedSprite";
import { TalkComponent } from "./generic/talk";
import { Power, PowerNetwork } from "./generic/power";
import { SolarPanel } from "./custom/solarPanel";
import { LootComponent } from "./custom/loot";


export function initComponents() {
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
    Component.register(SprinklerCore);
    Component.register(Sprinkler);
    Component.register(AnimatedSpriteRenderer);
    Component.register(TalkComponent);
    Component.register(Power);
    Component.register(PowerNetwork);
    Component.register(SolarPanel);
    Component.register(LootComponent);
}


export type WellDefinedComponentData = {
    id?: number,
} & (
        {
            componentType: "RoboLogic"
            data: ComponentDataOf<RoboLogic>
        } |
        {
            componentType: "BasicSprite"
            data: ComponentDataOf<BasicSprite>
        } |
        {
            componentType: "Transform"
            data: ComponentDataOf<Transform>
        } |
        {
            componentType: "SpriteDirection"
            data: ComponentDataOf<SpriteDirection>
        } |
        {
            componentType: "Interactable"
            data: ComponentDataOf<Interactable>
        } |
        {
            componentType: "Door"
            data: ComponentDataOf<Door>
        } |
        {
            componentType: "Plant"
            data: ComponentDataOf<Plant>
        } |
        {
            componentType: "Hitbox"
            data: ComponentDataOf<Hitbox>
        } |
        {
            componentType: "Pollution"
            data: ComponentDataOf<Pollution>
        } |
        {
            componentType: "Button"
            data: ComponentDataOf<Button>
        } |
        {
            componentType: "EntityTooltip"
            data: ComponentDataOf<EntityTooltip>
        } |
        {
            componentType: "ShaderMeshRenderer"
            data: ComponentDataOf<ShaderMeshRenderer>
        } |
        {
            componentType: "WindowRenderer"
            data: ComponentDataOf<WindowRenderer>
        } |
        {
            componentType: "LightComponent"
            data: ComponentDataOf<LightComponent>
        } |
        {
            componentType: "BiocharKiln"
            data: ComponentDataOf<BiocharKiln>
        } |
        {
            componentType: "TerrainAlign"
            data: ComponentDataOf<TerrainAlign>
        } |
        {
            componentType: "Trigger"
            data: ComponentDataOf<Trigger>
        } |
        {
            componentType: "Planter"
            data: ComponentDataOf<Planter>
        } |
        {
            componentType: "Inventory"
            data: ComponentDataOf<Inventory>
        } |
        {
            componentType: "SprinklerCore"
            data: ComponentDataOf<SprinklerCore>
        } |
        {
            componentType: "Sprinkler"
            data: ComponentDataOf<Sprinkler>
        } |
        {
            componentType: "AnimatedSpriteRenderer"
            data: ComponentDataOf<AnimatedSpriteRenderer>
        } |
        {
            componentType: "TalkComponent"
            data: ComponentDataOf<TalkComponent>
        } |
        {
            componentType: "Power"
            data: ComponentDataOf<Power>
        } |
        {
            componentType: "PowerNetwork"
            data: ComponentDataOf<PowerNetwork>
        } |
        {
            componentType: "SolarPanel"
            data: ComponentDataOf<SolarPanel>
        } |
        {
            componentType: "LootComponent"
            data: ComponentDataOf<LootComponent>
        }
    )











type ComponentDataOf<T extends Component> = Parameters<T["applyData"]>[0]