import { Color, Graphics, StrokeInput } from "pixi.js";
import { game } from "../game";
import { displayNumber } from "../utils/utils";
import { BasicSprite } from "../components/generic/basicSprite";
import { Hitbox } from "../components/generic/hitbox";
import { TooltipPanel } from "../ui/tooltip";
import { MouseButton } from "../input";
import { UIContextMenu } from "../ui/ui";
import { UIButton } from "../ui/uiButton";
import { UI } from "../ui/ui";
import { UIElement } from "../ui/ui";
import { UIPanel } from "../ui/ui";
import { HitboxEditor } from "./hitbox-editor";
import { Entity } from "../hierarchy/entity";
import { Vector } from "../utils/vector";
import { ParticleText } from "../hierarchy/particleText";
import { StateMode } from "../hierarchy/serialise";

export class Debug {
    private static debugTextElement: HTMLDivElement;
    private static _editorMode = false;
    public static get editorMode() {
        return Debug._editorMode;
    }
    public static set editorMode(value) {
        Debug._editorMode = value;
        if (value) {
            game.camera.customTarget = game.camera.position.result();
        }
        else {
            game.camera.customTarget = undefined;
        }

    }
    static debugView = false;
    static hitboxEditor: HitboxEditor;
    private static debugText = "";
    static graphicsWorldspace: Graphics;
    static movingEntity?: Entity;
    static log(text: string | number) { this.debugText += text + "\n"; };
    static update(dt: number) {
        this.graphicsWorldspace.clear();
        if (this.editorMode) {
            const camSpeed = 1000;
            if (game.input.key("a")) game.camera.customTarget!.x -= camSpeed * dt;
            if (game.input.key("d")) game.camera.customTarget!.x += camSpeed * dt;
            if (game.input.key("w")) game.camera.customTarget!.y -= camSpeed * dt;
            if (game.input.key("s")) game.camera.customTarget!.y += camSpeed * dt;
            if (game.input.keyUp(" ")) game.timeScale = game.timeScale == 1 ? 0 : 1;

            //draw grid
            this.drawGrid(10);
            this.drawGrid(40, { width: .25, color: 0xffffff, alpha: .1 });

            //draw origin lines at world 0
            this.graphicsWorldspace.moveTo(0, game.camera.worldPosition.y - game.camera.pixelScreen.y / 2);
            this.graphicsWorldspace.lineTo(0, game.camera.worldPosition.y + game.camera.pixelScreen.y / 2);
            this.graphicsWorldspace.stroke({ width: .5, color: 0x00ff00, alpha: .2 });
            this.graphicsWorldspace.moveTo(game.camera.worldPosition.x - game.camera.pixelScreen.x / 2, 0);
            this.graphicsWorldspace.lineTo(game.camera.worldPosition.x + game.camera.pixelScreen.x / 2, 0);
            this.graphicsWorldspace.stroke({ width: .5, color: 0xff0000, alpha: .2 });

        }
        if (this.debugView || this.editorMode) {
            const nearestEntity = game.nearestEntity(game.worldMouse);
            for (const entity of game.activeScene.objects) {
                if (entity instanceof Entity) {
                    this.graphicsWorldspace.circle(entity.transform.position.x, entity.transform.position.y, 2);
                }
            }
            this.graphicsWorldspace.stroke({ width: 1, color: 0xaaaaaa });
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
            }
            if (game.input.mouse.getButtonUp(MouseButton.Right)) {
                const buttons = [];
                const header = new UIElement("div", "header");
                buttons.push(header);
                if (nearestEntity && nearestEntity.transform.position.distance(game.worldMouse) < 100) {
                    header.htmlElement.innerText = nearestEntity.name;
                    buttons.push(new UIButton("Delete", () => nearestEntity.remove()));
                    buttons.push(new UIButton("Move", () => { this.movingEntity = nearestEntity }));
                    buttons.push(new UIButton("Copy to Clipboard", () => {
                        navigator.clipboard.writeText(JSON.stringify(nearestEntity.toData()));
                    }));
                    buttons.push(new UIButton("Duplicate", () => {
                        const data = nearestEntity.toData();
                        const entity = Entity.fromData(data as any, game.activeScene);
                        entity.transform.position.set(game.worldMouse,0);
                        this.movingEntity = entity;
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
                            entity.transform.position.set(game.worldMouse,0);
                            this.movingEntity = entity;

                        } catch (error: any) {
                            new ParticleText((error as Error).message, Vector.fromLike(game.worldMouse));
                        }
                    }))
                    buttons.push(new UIButton("Copy scene", async () => {
                        navigator.clipboard.writeText(JSON.stringify(game.activeScene.serialise(StateMode.scene)));
                    }))
                }

                new UIContextMenu(...buttons);
            }
        }
        if (!UIContextMenu.current && this.debugView) {
            this.debugTooltip();
        }
        if (this.movingEntity) {
            this.movingEntity.transform.position.x = game.worldMouse.x;
            this.movingEntity.transform.position.y = game.worldMouse.y;
            if (game.input.mouse.getButtonDown(MouseButton.Left)) this.movingEntity = undefined;
        }
        this.hitboxEditor.update();
        this.debugTextElement.innerText = this.debugText;
        this.debugText = "";
    }
    static init() {
        this.debugView = false;
        this.editorMode = false;
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
    static drawGrid(gridSize: number = 10, style: StrokeInput = { width: .25, color: 0xffffff, alpha: .1 }) {
        for (let x = game.camera.worldPosition.x - game.camera.pixelScreen.x / 2; x < game.camera.worldPosition.x + game.camera.pixelScreen.x / 2; x += gridSize) {
            x = Math.floor(x / gridSize) * gridSize;
            this.graphicsWorldspace.moveTo(x, game.camera.worldPosition.y - game.camera.pixelScreen.y / 2);
            this.graphicsWorldspace.lineTo(x, game.camera.worldPosition.y + game.camera.pixelScreen.y / 2);
        }
        for (let y = game.camera.worldPosition.y - game.camera.pixelScreen.y / 2; y < game.camera.worldPosition.y + game.camera.pixelScreen.y / 2; y += gridSize) {
            y = Math.floor(y / gridSize) * gridSize;
            this.graphicsWorldspace.moveTo(game.camera.worldPosition.x - game.camera.pixelScreen.x / 2, y);
            this.graphicsWorldspace.lineTo(game.camera.worldPosition.x + game.camera.pixelScreen.x / 2, y);
        }
        this.graphicsWorldspace.stroke(style);
    }
}