import { Color, Graphics, StrokeInput } from "pixi.js";
import { game } from "../game";
import { displayNumber } from "../utils/utils";
import { BasicSprite } from "../components/generic/basicSprite";
import { Hitbox } from "../components/generic/hitbox";
import { TooltipPanel } from "../ui/tooltip";
import { MouseButton } from "../input";
import { UIContextMenu } from "../ui/contextMenu";
import { UIButton } from "../ui/button";
import { UI } from "../ui/ui";
import { UIPanel } from "../ui/panel";
import { UIElement } from "../ui/uiElement";
import { HitboxEditor } from "./hitbox-editor";
import { Entity } from "../hierarchy/entity";

export class Debug {
    private static debugTextElement: HTMLDivElement;
    static debugMode = false;
    static debugView = false;
    static hitboxEditor: HitboxEditor;
    private static debugText = "";
    static graphicsWorldspace: Graphics;
    static movingEntity?:Entity;
    static log(text: string | number) { this.debugText += text + "\n"; };
    static update(dt: number) {
        this.graphicsWorldspace.clear();
        if (this.debugView) {
            const nearestEntity = game.nearestEntity(game.worldMouse);
            for (let x = 0; x < game.terrain.nodes.length; x++) {
                const node = game.terrain.nodes[x];
                const tdata = game.terrain.getProperties(node.x);
                const adata = game.atmo.getProperties(node.x);
                if (tdata == undefined) continue;
                this.graphicsWorldspace.circle(node.x, node.y, adata.pollution * 10);
                this.graphicsWorldspace.stroke({ width: 1, color: new Color({ r: 255, g: 100, b: 0, a: 1 }) });
            }
            if (nearestEntity && nearestEntity.transform.position.distance(game.worldMouse) < 100) {
                this.graphicsWorldspace.moveTo(nearestEntity.transform.position.x, nearestEntity.transform.position.y);
                this.graphicsWorldspace.lineTo(game.worldMouse.x, game.worldMouse.y);
                this.graphicsWorldspace.stroke({ color: 0x999999, width: 0.25 });
                const sprite = nearestEntity.getComponent(BasicSprite);
                if (sprite) {
                    this.graphicsWorldspace.rect(sprite.sprite.bounds.x + nearestEntity.transform.position.x, sprite.sprite.bounds.y + nearestEntity.transform.position.y, sprite.sprite.bounds.width, sprite.sprite.bounds.height);
                    this.graphicsWorldspace.stroke(0x999999);
                }
                const hitbox = nearestEntity.getComponent(Hitbox);
                if (hitbox && !this.hitboxEditor.editing) {
                    this.drawHitbox(hitbox)
                }
                if (game.input.mouse.getButtonUp(MouseButton.Right)) {
                    const buttons = [];
                    const header = new UIElement("div", "header");
                    header.htmlElement.innerText = nearestEntity.name;
                    buttons.push(header);
                    buttons.push(new UIButton("Delete", () => nearestEntity.remove()));
                    buttons.push(new UIButton("Move", () => { this.movingEntity = nearestEntity }));
                    buttons.push(new UIButton("Copy to Clipboard", () => {
                        navigator.clipboard.writeText(JSON.stringify(nearestEntity.toData()));
                    }));

                    const hb = nearestEntity.getComponent(Hitbox);
                    if (hb) {
                        buttons.push(new UIButton("Edit hitbox", () => { this.hitboxEditor.startEditing(hb) }));
                    }

                    new UIContextMenu(...buttons);
                }
                
            }
            if (!UIContextMenu.current) {
                this.debugTooltip();
            }
        }
        if(this.movingEntity) {
            this.movingEntity.transform.position.x = game.worldMouse.x;
            this.movingEntity.transform.position.y = game.worldMouse.y;
            if(game.input.mouse.getButtonDown(MouseButton.Left)) this.movingEntity = undefined;
        }
        this.hitboxEditor.update();
        this.debugTextElement.innerText = this.debugText;
        this.debugText = "";
    }
    static init() {
        this.hitboxEditor = new HitboxEditor();
        this.debugTextElement = UI.customDiv(document.body, "debugText");
    }
    private static debugTooltip() {
        const columns: TooltipPanel[] = [];
        let text = "";
        text += "CO2: " + displayNumber(game.atmo.co2, 2) + "\n";
        text += "TEMP: " + displayNumber(game.atmo.celsius, 2) + "\n";
        Object.entries(game.atmo.getProperties(game.worldMouse.x)).forEach(([key, value]) => text += `${key}: ${displayNumber(value, 2)}\n`);
        columns.push({ title: "Atmo", text: text });
        text = "";
        Object.entries(game.terrain.getProperties(game.worldMouse.x)).forEach(([key, value]) => text += `${key}: ${displayNumber(value, 2)}\n`);
        columns.push({ title: "Terrain", text: text });
        text = "";
        Object.entries(game.weather.weatherData).forEach(([key, value]) => text += `${key}: ${displayNumber(value, 2)}\n`);
        columns.push({ title: "Weather", text: text });
        game.tooltip.hover(
            { title: "Debug data" },
            { text: "X: " + Math.floor(game.worldMouse.x) + " // Y: " + Math.floor(game.worldMouse.y), highlight: true },
            { columns: columns }
        )
    }
    static drawHitbox(hitbox: Hitbox, style: StrokeInput = { color: 0xff0000, width: 1 }) {
        this.graphicsWorldspace.moveTo(hitbox.nodes[0].x + hitbox.transform.position.x, hitbox.nodes[0].y + hitbox.transform.position.y);
        for (const node of hitbox.nodes) {
            this.graphicsWorldspace.lineTo(node.x + hitbox.transform.position.x, node.y + hitbox.transform.position.y);
        };
        this.graphicsWorldspace.stroke(style);
    }
}