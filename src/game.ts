import { Application, Assets, Container, Graphics, Sprite, Ticker } from "pixi.js";
import { PixelLayer } from "./pixelRendering/pixelLayer";
import { Terrain } from "./terrain";
import { System } from "detect-collisions";
import { Player } from "./player";
import { Camera } from "./camera";
import { Vector, Vectorlike } from "./vector";
import { initHandlers, StateManager, StateMode } from "./hierarchy/serialise";
import { htcrudLoad, htcrudSave } from "./dev/htcrud-helper";
import { Entity } from "./hierarchy/entity";
import { initComponents } from "./components/generic/componentIndex";
import { Scene } from "./hierarchy/scene";
import doorHitbox from "./environment/doorHitbox.json";
import interior from "./environment/hitbox.json";

export let game: Game;

export class Game {
    static pixelScale = 4;
    app: Application;
    keys: { [key: string]: boolean } = {};
    camera!: Camera;
    stateManager!: StateManager;
    scenes: Map<string, Scene> = new Map<string, Scene>();
    activeScene!: Scene;

    terrain!: Terrain;
    player!: Player;
    pixelLayer!: PixelLayer;
    terrainContainer!: Container;
    playerContainer!: Container;
    pixelFG!: PixelLayer;
    pixelFG2!: PixelLayer;
    worldDebugGraphics!: Graphics;

    mousePos = { x: 0, y: 0 };
    mousePixels = { x: 0, y: 0 };
    collisionSystem!: System;

    get worldMouse(): Vectorlike {
        return new Vector()
            .add(this.mousePixels)
            .add(this.camera.worldPosition)
            .sub({ x: this.camera.middle.x / Game.pixelScale, y: this.camera.middle.y / Game.pixelScale });
    }

    constructor(app: Application) {
        game = this;
        this.app = app;

        document.addEventListener("keydown", (e) => (this.keys[e.key.toLowerCase()] = true));
        document.addEventListener("keyup", (e) => delete this.keys[e.key.toLowerCase()]);

        document.addEventListener("mousemove", (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
            this.mousePixels.x = Math.round(this.mousePos.x / Game.pixelScale);
            this.mousePixels.y = Math.round(this.mousePos.y / Game.pixelScale);
        });

        window.addEventListener("resize", () => this.resize());
    }

    resize() { }

    async init() {
        this.stateManager = new StateManager();
        this.activeScene = new Scene();
        game.scenes.set(this.activeScene.name, this.activeScene);

        initHandlers();
        initComponents();
        this.collisionSystem = new System();
        this.camera = new Camera();
        const bg = new Sprite(await Assets.load("./bg.png"));
        bg.scale.set(1);
        this.app.stage.addChild(bg);

        const scene2 = new Scene();
        scene2.name = "Scene 2";
        game.scenes.set(scene2.name, scene2);
        const s2t = new Array(1000).fill({ x: 0, y: 0 }).map((n, i) => ({ x: i * 10, y: 0 }));
        const s2td = new Array(1000).fill({ pollution: 0, fertility: 0, erosion: 0, moisture: 0 });

        scene2.data = [
            {
                kind: "Entity",
                component: [
                    {
                        componentType: "BasicSprite",
                        data: {
                            asset: "./door.png",
                        },
                    },
                    {
                        componentType: "Interactable",
                    },
                    {
                        componentType: "Door",
                        data: {
                            target: "Scene",
                        },
                    },
                    {
                        componentType: "Transform",
                        data: {
                            position: { x: 40, y: 20 },
                            velocity: { x: 10, y: 0 },
                        },
                    },
                ],
            },
            {
                kind: "Entity",
                component: [
                    {
                        componentType: "Transform",
                        data: {
                            position: { x: 40, y: 0 },
                            velocity: { x: 10, y: 0 },
                        },
                    },
                    {
                        componentType: "HitboxComponent",
                        data: {
                            nodes: doorHitbox,
                            interior: true,
                        }
                    }
                ]
            },
            {
                kind: "Player",
                position: { x: 10, y: 0 },
                velocity: { x: 0, y: 0 },
            },
            {
                kind: "Terrain",
                terrainMesh: [...s2t],
                terrainData: [...s2td],
            },
        ];

        this.pixelFG = new PixelLayer(this.app.canvas.width / Game.pixelScale, this.app.canvas.height / Game.pixelScale);
        //this.app.stage.addChild(this.pixelFG.sprite);
        const fg = new Sprite(await Assets.load("./4.png"));
        fg.texture.source.scaleMode = "nearest";
        fg.scale.set(1);
        this.pixelFG.container.addChild(fg);

        this.pixelLayer = new PixelLayer(this.app.canvas.width / Game.pixelScale, this.app.canvas.height / Game.pixelScale);
        this.app.stage.addChild(this.pixelLayer.sprite);

        //this.app.stage.addChild(this.terrainContainer = new Container());
        this.app.stage.addChild((this.playerContainer = new Container()));
        this.terrainContainer = this.pixelLayer.container;
        this.app.stage.addChild((this.worldDebugGraphics = new Graphics()));
        this.worldDebugGraphics.scale.set(Game.pixelScale);

        this.pixelFG2 = new PixelLayer(this.app.canvas.width / Game.pixelScale, this.app.canvas.height / Game.pixelScale);
        //this.app.stage.addChild(this.pixelFG2.sprite);
        const fg2 = new Sprite(await Assets.load("./5.png"));
        fg2.texture.source.scaleMode = "nearest";
        fg2.scale.set(1);
        this.pixelFG2.container.addChild(fg2);

        this.player = new Player();
        this.player.sprite.texture = await Assets.load("./char.png");
        this.player.sprite.texture.source.scaleMode = "nearest";

        Entity.fromData(
            {
                kind: "Entity",
                component: [
                    {
                        componentType: "SpriteDirectionComponent",
                    },
                    {
                        componentType: "BasicSprite",
                        data: {
                            asset: "./robo.png",
                        },
                    },
                    {
                        componentType: "RoboLogic",
                    },
                ],
            },
            this.activeScene
        );

        Entity.fromData(
            {
                kind: "Entity",
                component: [
                    {
                        componentType: "Transform",
                        data: {
                            position: { x: 100, y: 100 },
                        },
                    },
                    {
                        componentType: "BasicSprite",
                        data: {
                            asset: "./door.png",
                        },
                    },
                    {
                        componentType: "Interactable",
                    },
                    {
                        componentType: "Door",
                        data: {
                            target: "Scene 2",
                        },
                    },
                    {
                        componentType: "HitboxComponent",
                        data: {
                            nodes: doorHitbox,
                        }
                    }
                ],
            },
            this.activeScene
        );


        Entity.fromData(
            {
                kind: "Entity",
                component: [
                    {
                        componentType: "Transform",
                        data: {
                            position: { x: 100, y: 100 },
                        },
                    },
                    {
                        componentType: "BasicSprite",
                        data: {
                            asset: "./tree.png",
                        },
                    },
                    {
                        componentType: "Interactable",
                    },
                    {
                        componentType: "Tree",
                        data: {
                            growth: 0,
                            asset: "./tree.png",
                        },
                    },
                ],
            },
            this.activeScene
        );


        Entity.fromData(
            {
                kind: "Entity",
                component: [
                    {
                        componentType: "Transform",
                        data: {
                            position: { x: 300, y: 100 },
                        },
                    },
                    {
                        componentType: "BasicSprite",
                        data: {
                            asset: "./bush.png",
                        },
                    },
                    {
                        componentType: "Interactable",
                    },
                    {
                        componentType: "Tree",
                        data: {
                            growth: 0,
                            asset: "./bush.png",
                        },
                    },
                ],
            },
            this.activeScene
        );

        this.terrain = new Terrain();

        this.app.ticker.add(this.update, this);
    }

    update(ticker: Ticker) {
        const dt = ticker.deltaMS / 1000;

        this.worldDebugGraphics.clear();

        this.activeScene.update(dt);
        this.activeScene.draw(dt);

        this.pixelFG.sprite.x = (this.mousePos.x - screen.width / 2) / 10;
        this.pixelFG.sprite.y = (this.mousePos.y - screen.height / 2) / 10;

        this.pixelFG2.sprite.x = (this.mousePos.x - screen.width / 2) / -5;
        this.pixelFG2.sprite.y = (this.mousePos.y - screen.height / 2) / -5;

        this.camera.update(dt);

        this.worldDebugGraphics.circle(this.worldMouse.x, this.worldMouse.y, 5);
        this.worldDebugGraphics.stroke(0x999999);

        this.pixelLayer.render();
        this.pixelFG.render();
        this.pixelFG2.render();
        this.app.render();

        const address = "http://localhost:3000/state.json";

        if (this.keys["q"]) {
            let out = this.stateManager.serialise(StateMode.full);
            htcrudSave(address, out);
        }

        if (this.keys["e"]) {
            htcrudLoad(address).then((data) => this.stateManager.deserialise(data));
        }

        if (this.keys["ě"]) {
            if (this.activeScene.name != "Scene 2") {
                this.loadScene("Scene 2");
            }
        }

        if (this.keys["+"]) {
            if (this.activeScene.name != "Scene") {
                this.loadScene("Scene");
            }
        }
    }

    loadScene(name: string) {
        this.activeScene.serialise(StateMode.full);
        this.activeScene.unload();
        this.activeScene = this.scenes.get(name)!;
        this.activeScene.load();
    }
}
