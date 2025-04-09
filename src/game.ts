import { Application, Assets, Color, Container, Graphics, Sprite, Ticker } from "pixi.js";
import { PixelLayer } from "./pixelRendering/pixelLayer";
import { Terrain } from "./terrain";
import { System } from "detect-collisions";
import { Player } from "./player";
import { Camera } from "./camera";
import { Vector, Vectorlike } from "./vector";
import { initHandlers, StateManager, StateMode } from "./hierarchy/serialise";
import { htcrudLoad, htcrudSave } from "./dev/htcrud-helper";
import { Entity } from "./hierarchy/entity";
import { Scene } from "./hierarchy/scene";
import doorHitbox from "./environment/doorHitbox.json";
import interior from "./environment/hitbox.json";
import { initComponents } from "./components/componentIndex";
import { ProgressDatabase } from "./hierarchy/progressDatabase";
import { ParticleText } from "./hierarchy/particleText";
import { DevSync } from "./devsync";
import { HitboxComponent } from "./components/generic/HitboxComponent";
import { BasicSprite } from "./components/generic/BasicSprite";
import { HackingMinigame } from "./hacking-minigame/hacking";
import { Input } from "./input";
import { TimedShader } from "./shaders/timedShader";
import { Tooltip } from "./tooltip";
import { Prefab } from "./hierarchy/prefabs";
import { Atmo } from "./atmo";

export let game: Game;

export class Game {
    static pixelScale = 4;

    elapsedTime = 0;

    app: Application;
    input: Input;
    camera!: Camera;
    stateManager!: StateManager;
    progressDatabase!: ProgressDatabase;
    scenes: Map<string, Scene> = new Map<string, Scene>();
    activeScene!: Scene;

    hacking?: HackingMinigame;

    terrain!: Terrain;
    atmo!: Atmo;
    player!: Player;
    pixelLayer!: PixelLayer;
    terrainContainer!: Container;
    playerContainer!: Container;
    foliageContainer!: Container;
    worldDebugGraphics!: Graphics;

    collisionSystem!: System;
    tooltip!: Tooltip;

    get worldMouse(): Vectorlike {
        return new Vector()
            .add(this.input.mouse.pixelPosition)
            .add(this.camera.worldPosition)
            .sub({ x: this.camera.middle.x / Game.pixelScale, y: this.camera.middle.y / Game.pixelScale });
    }

    constructor(app: Application) {
        game = this;
        this.app = app;
        this.input = new Input();

        window.addEventListener("resize", () => this.resize());

        window.addEventListener("beforeunload", (e) => {
            if (this.input.key("control") && !this.input.key("r")) e.preventDefault();
        });

        document.addEventListener("contextmenu", (e) => e.preventDefault());
        document.addEventListener("click", (e) => {
            [];
            if (this.input.key("control")) {
                const nearest = this.nearestEntity(this.worldMouse);

                if (nearest) DevSync.trigger(nearest.toData());
            }
        });
    }

    resize() { }

    async init() {
        this.stateManager = new StateManager();
        this.progressDatabase = new ProgressDatabase();
        this.stateManager.register(this.progressDatabase);
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
                        componentType: "BasicSprite",
                        data: {
                            asset: "./robo.png",
                        },
                    },
                    {
                        componentType: "Interactable",
                    },
                    {
                        componentType: "Button",
                        data: {
                            dbName: "pollutionSpeed",
                        },
                    },
                    {
                        componentType: "Transform",
                        data: {
                            position: { x: 10, y: 20 },
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
                        },
                    },
                ],
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

        this.pixelLayer = new PixelLayer(this.app.canvas.width / Game.pixelScale, this.app.canvas.height / Game.pixelScale);
        this.app.stage.addChild(this.pixelLayer.sprite);

        //this.app.stage.addChild(this.terrainContainer = new Container());
        this.app.stage.addChild((this.playerContainer = new Container()));
        this.pixelLayer.container.addChild((this.terrainContainer = new Container()));
        this.pixelLayer.container.addChild((this.foliageContainer = new Container()));
        this.app.stage.addChild((this.worldDebugGraphics = new Graphics()));
        this.worldDebugGraphics.scale.set(Game.pixelScale);


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
                        componentType: "PollutionComponent",
                        data: {
                            speed: 1,
                            dbName: "pollutionSpeed",
                        },
                    },
                ],
            },
            this.activeScene
        );

        Prefab.Tree({ scene: this.activeScene, x: 100, y: 100, asset: "./tree.png" });
        Prefab.Tree({ scene: this.activeScene, x: 300, y: 100, asset: "./bush.png" });


        this.terrain = new Terrain();
        this.tooltip = new Tooltip();

        this.atmo = new Atmo();

        this.app.ticker.add(this.update, this);
    }

    update(ticker: Ticker) {
        const dt = ticker.deltaMS / 1000;
        this.elapsedTime += dt;
        TimedShader.update(this.elapsedTime);

        this.tooltip.update(dt);

        this.worldDebugGraphics.clear();

        for (const particleText of [...ParticleText.list]) {
            particleText.update(dt);
        }
        this.activeScene.update(dt);
        this.activeScene.draw(dt);

        for (let x = 0; x < this.terrain.nodes.length; x++) {
            const node = this.terrain.nodes[x];
            const data = this.terrain.getProperties(node.x);
            if (data == undefined) continue;
            this.worldDebugGraphics.circle(node.x, node.y, data.pollution * 10);
            this.worldDebugGraphics.fill(new Color({ r: data.pollution * 255, g: data.pollution * 255, b: 0, a: 1 }));
        }

        this.camera.update(dt);

        this.worldDebugGraphics.circle(this.worldMouse.x, this.worldMouse.y, 5);
        this.worldDebugGraphics.stroke(0x999999);

        this.pixelLayer.render();


        const address = "http://localhost:3000/state.json";

        if (this.input.keyDown("h")) {
            if (this.hacking) this.hacking = this.hacking.close();
            else this.hacking = new HackingMinigame();
        }

        if (this.hacking) {
            this.hacking.update();
        }
        else {
            if (this.input.keyDown("q")) {
                let out = this.stateManager.serialise(StateMode.full);
                htcrudSave(address, out);
            }

            if (this.input.keyDown("e")) {
                htcrudLoad(address).then((data) => {
                    this.stateManager.deserialise(data);
                });
            }

            if (this.input.keyDown("ě")) {
                if (this.activeScene.name != "Scene 2") {
                    this.loadScene("Scene 2");
                }
            }

            if (this.input.keyDown("+")) {
                if (this.activeScene.name != "Scene") {
                    this.loadScene("Scene");
                }
            }

            if (this.input.key("control")) {
                const nearest = this.nearestEntity(this.worldMouse);
                if (nearest) {
                    this.worldDebugGraphics.moveTo(nearest.transform.position.x, nearest.transform.position.y);
                    this.worldDebugGraphics.lineTo(this.worldMouse.x, this.worldMouse.y);
                    this.worldDebugGraphics.stroke({ color: 0x999999, width: 0.25 });
                    const sprite = nearest.getComponent(BasicSprite);
                    if (sprite) {
                        this.worldDebugGraphics.rect(sprite.sprite.bounds.x + nearest.transform.position.x, sprite.sprite.bounds.y + nearest.transform.position.y, sprite.sprite.bounds.width, sprite.sprite.bounds.height);
                        this.worldDebugGraphics.stroke(0x999999);
                    }
                    const hitbox = nearest.getComponent(HitboxComponent);
                    if (hitbox) {
                    }
                }
            }
        }


        this.input.update();
    }

    loadScene(name: string) {
        this.activeScene.serialise(StateMode.full);
        this.scenes.get(name)!.load();
    }

    nearestEntity(position: Vectorlike) {
        let nearest = undefined;
        let nearestDistance = Infinity;
        for (const entity of game.activeScene.objects) {
            if (entity instanceof Entity) {
                const distance = entity.transform.position.distanceSquared(position);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearest = entity;
                }
            }
        }

        return nearest;
    }
}
