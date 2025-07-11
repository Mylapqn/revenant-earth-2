import { Color, Container, Graphics, StrokeStyle } from "pixi.js";
import { game } from "../game";
import { clamp, displayNumber } from "../utils/utils";
import { TooltipPanel } from "../ui/tooltip";
import { MouseButton } from "../input";
import { UIContextMenu } from "../ui/uiContextMenu";
import { UIButton } from "../ui/uiButton";
import { UI } from "../ui/ui";
import { UIElement } from "../ui/uiElement";
import { HitboxEditor } from "./hitbox-editor";
import { Entity } from "../hierarchy/entity";
import { Vector } from "../utils/vector";
import { ParticleText } from "../hierarchy/particleText";
import { StateMode } from "../hierarchy/serialise";
import { objcount } from "../utils/counter";
import { Prefab } from "../hierarchy/prefabs";
import BasicSprite from "../components/generic/basicSprite";
import Hitbox from "../components/generic/hitbox";

const entityDistance = 50;

export class Debug {
    private static debugTextElement: HTMLDivElement;
    private static _editorMode = false;
    static movingElapsed: number = 0;
    public static get editorMode() {
        return Debug._editorMode;
    }
    public static set editorMode(value) {
        Debug._editorMode = value;
        if (value) {
            game.camera.customTarget = game.camera.position.clone();
            game.camera.zoomSpeed = 10;
        }
        else {
            game.camera.customTarget = undefined;
            game.camera.targetZoom = 1;
            game.camera.zoomSpeed = 1;
            this.hitboxEditor?.stopEditing();
            game.timeScale = 1;
        }

    }
    static debugView = false;
    static hitboxEditor: HitboxEditor;
    private static debugText = "";
    static containerWorldspace: Container;
    static graphicsWorldspace: Graphics;
    static movingEntity?: Entity;
    static log(text: string | number) { this.debugText += text + "\n"; };
    static update(dt: number) {
        if (this.containerWorldspace.children.length > 1)
            this.containerWorldspace.removeChildren(1);
        this.graphicsWorldspace.clear();
        /*
        if(this.memtext == "") this.snapMemory();
        if (game.input.keyDown(";")) {
            this.memtext = "";
            this.snapMemory();
            navigator.clipboard.writeText(this.memtext);
        }*/

        if (this.editorMode) {
            this.log("Editor Mode");
            if (game.timeScale == 0) this.log("Game paused");
            const camSpeed = 1000 / game.camera.zoom;
            if (game.input.key("a")) game.camera.customTarget!.x -= camSpeed * dt;
            if (game.input.key("d")) game.camera.customTarget!.x += camSpeed * dt;
            if (game.input.key("w")) game.camera.customTarget!.y -= camSpeed * dt;
            if (game.input.key("s")) game.camera.customTarget!.y += camSpeed * dt;
            if (game.input.mouse.getButton(MouseButton.Wheel)) game.camera.customTarget?.sub(game.input.mouse.delta.clone().mult(1 / game.camera.zoom));
            if (game.input.keyUp(" ")) game.timeScale = game.timeScale == 1 ? 0 : 1;
            if (game.input.mouse.scroll) game.camera.targetZoom = clamp(game.camera.targetZoom * (1 - game.input.mouse.scroll * .2), .25, 4);

            //draw grid
            this.drawGrid(10, { width: .5, color: 0xffffff, alpha: .1 * game.camera.zoom });
            this.drawGrid(40, { width: 1, color: 0xffffff, alpha: .1 * game.camera.zoom });

            //draw origin lines at world 0
            this.graphicsWorldspace.moveTo(0, game.camera.worldPosition.y - game.camera.pixelScreen.y / 2);
            this.graphicsWorldspace.lineTo(0, game.camera.worldPosition.y + game.camera.pixelScreen.y / 2);
            this.graphicsWorldspace.stroke({ width: .5 / game.camera.zoom, color: 0x00ff00, alpha: .4 });
            this.graphicsWorldspace.moveTo(game.camera.worldPosition.x - game.camera.pixelScreen.x / 2, 0);
            this.graphicsWorldspace.lineTo(game.camera.worldPosition.x + game.camera.pixelScreen.x / 2, 0);
            this.graphicsWorldspace.stroke({ width: .5 / game.camera.zoom, color: 0xff0000, alpha: .4 });

        }
        if (this.editorMode && !this.hitboxEditor.editing) {
            const nearestEntity = game.nearestEntity(game.worldMouse);
            const entitiesOnScreen: Entity[] = Array.from(game.activeScene.objects).filter(e => e instanceof Entity && game.camera.inView(e.transform.position, 50)) as Entity[];
            for (const entity of entitiesOnScreen) {
                this.graphicsWorldspace.circle(entity.transform.position.x, entity.transform.position.y, 2);
                this.graphicsWorldspace.stroke({ width: 1, color: 0xaaaaaa });
                for (const component of entity.components.values()) {
                    component.debugDraw(this.graphicsWorldspace);
                }
            }
            if (game.activeScene.hasTerrain) {
                for (let x = 0; x < game.terrain.nodes.length; x++) {
                    const node = game.terrain.nodes[x];
                    const tdata = game.terrain.getProperties(node.x);
                    const adata = game.atmo.getProperties(node.x);
                    if (tdata == undefined) continue;
                    this.graphicsWorldspace.circle(node.x, node.y, adata.pollution * 10);
                    this.graphicsWorldspace.stroke({ width: 1, color: new Color({ r: 255, g: 100, b: 0, a: 1 }) });
                }
            }
            if (nearestEntity && nearestEntity.transform.position.distance(game.worldMouse) < entityDistance) {
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
                if (game.input.mouse.getButtonDown(MouseButton.Left) && UI.mouseOverElements.size == 0) {
                    if (game.input.key("shift")) this.movingEntity = this.duplicateEntity(nearestEntity);
                    else this.movingEntity = nearestEntity;
                }
            }
            if (game.input.mouse.getButtonUp(MouseButton.Right)) {
                const buttons = [];
                const header = new UIElement({ type: "div", classes: ["header"] });
                buttons.push(header);
                if (nearestEntity && nearestEntity.transform.position.distance(game.worldMouse) < entityDistance) {
                    header.htmlElement.innerText = nearestEntity.name;
                    buttons.push(new UIButton("Delete", () => nearestEntity.remove()));
                    buttons.push(new UIButton("Copy to Clipboard", () => {
                        navigator.clipboard.writeText(JSON.stringify(nearestEntity.toData()));
                    }));
                    buttons.push(new UIButton("Duplicate", () => {
                        this.movingEntity = this.duplicateEntity(nearestEntity);
                    }))
                    buttons.push(new UIButton("Paste from Clipboard", async () => {
                        try {
                            const data = JSON.parse(await navigator.clipboard.readText());
                            nearestEntity.applyData(data);

                        } catch (error: any) {
                            new ParticleText((error as Error).message, Vector.fromLike(game.worldMouse));
                        }
                    }))

                    nearestEntity.components.forEach((component) => {
                        buttons.push(...component.debugOptions([]));
                    });
                }
                else {
                    header.htmlElement.innerText = "Empty space";
                    buttons.push(new UIButton("Paste new Entity", async () => {
                        try {
                            const data = JSON.parse(await navigator.clipboard.readText());
                            const entity = Entity.fromData(data, game.activeScene);
                            entity.transform.position.set(game.worldMouse);
                            this.movingEntity = entity;

                        } catch (error: any) {
                            new ParticleText((error as Error).message, Vector.fromLike(game.worldMouse));
                        }
                    }))
                    buttons.push(new UIButton("Copy scene", async () => {
                        navigator.clipboard.writeText(JSON.stringify(game.activeScene.serialise(StateMode.scene).data));
                    }))
                }

                new UIContextMenu(...buttons);
            }
        }
        if (!UIContextMenu.current && this.debugView) {
            this.debugTooltip();
        }
        if (this.movingEntity) {
            this.movingElapsed += dt;

            const snapSize = game.input.key("control") ? 10 : 1;

            this.movingEntity.transform.position.x = Math.round(game.worldMouse.x / snapSize) * snapSize;
            this.movingEntity.transform.position.y = Math.round(game.worldMouse.y / snapSize) * snapSize;

            if (game.input.mouse.getButtonUp(MouseButton.Left) && this.movingElapsed > 0.2) {
                this.movingEntity = undefined
                this.movingElapsed = 0;
            }
        }
        this.hitboxEditor.update();
        this.debugTextElement.innerText = this.debugText;
        this.debugText = "";
    }
    static init() {
        this.debugView = false;
        this.editorMode = false;
        this.hitboxEditor = new HitboxEditor();
        this.debugTextElement = UI.customDiv(UI.container, "debugText");
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
        game.tooltipLegacy.hover(
            { title: "Debug data" },
            { text: "X: " + Math.floor(game.worldMouse.x) + " // Y: " + Math.floor(game.worldMouse.y), highlight: true },
            { columns: columns }
        )
    }
    static drawHitbox(hitbox: Hitbox, style: StrokeStyle = { color: 0xff0000, width: 1 }) {
        this.graphicsWorldspace.moveTo(hitbox.nodes[0].x + hitbox.transform.position.x, hitbox.nodes[0].y + hitbox.transform.position.y);
        for (const node of hitbox.nodes) {
            this.graphicsWorldspace.lineTo(node.x + hitbox.transform.position.x, node.y + hitbox.transform.position.y);
        };
        this.graphicsWorldspace.stroke(style);
    }
    static drawGrid(gridSize: number = 10, style: StrokeStyle = { width: .25, color: 0xffffff, alpha: .1 }) {
        const offset = 0;
        for (let x = game.camera.worldPosition.x - game.camera.pixelScreen.x / 2; x < game.camera.worldPosition.x + game.camera.pixelScreen.x / 2; x += gridSize) {
            x = Math.floor(x / gridSize) * gridSize;
            this.graphicsWorldspace.moveTo(x - offset, game.camera.worldPosition.y - game.camera.pixelScreen.y / 2 - offset);
            this.graphicsWorldspace.lineTo(x - offset, game.camera.worldPosition.y + game.camera.pixelScreen.y / 2 - offset);
        }
        for (let y = game.camera.worldPosition.y - game.camera.pixelScreen.y / 2; y < game.camera.worldPosition.y + game.camera.pixelScreen.y / 2; y += gridSize) {
            y = Math.floor(y / gridSize) * gridSize;
            this.graphicsWorldspace.moveTo(game.camera.worldPosition.x - game.camera.pixelScreen.x / 2 - offset, y - offset);
            this.graphicsWorldspace.lineTo(game.camera.worldPosition.x + game.camera.pixelScreen.x / 2 - offset, y - offset);
        }
        style.width! /= game.camera.zoom;
        this.graphicsWorldspace.stroke(style);
    }
    static duplicateEntity(entity: Entity) {
        const data = entity.toData();
        const newEntity = Entity.fromData(data as any, game.activeScene);
        newEntity.transform.position.set(game.worldMouse);
        return newEntity;
    }

    static prefab(name: string) {
        // @ts-ignore
        Prefab[name]({ position: game.worldMouse, scene: game.activeScene });
    }

    private static lastMem = new Map<string, number>();
    private static memBenchmark = new Map<string, number>();

    static memtext = "";

    static snapMemory() {
        const path = ["game"];
        const score = new Map<string, number>();
        objcount(game, path, [], score, 5);
        const display = new Array<{ string: string; count: number }>();
        score.forEach((v, k) => display.push({ string: k, count: v - (this.memBenchmark.get(k) ?? 0) }));
        display.sort((a, b) => b.count - a.count);
        for (let index = 0; index < display.length; index++) {
            const difference = score.get(display[index].string)! - this.lastMem.get(display[index].string)!;


            const count = display[index].count

            const path = display[index].string;

            this.memtext += count + "\t" + path + "\t" + difference + "\n";
        }
        //if (game.input.key("m")) this.memBenchmark = score;
        this.lastMem = score;
    }
}