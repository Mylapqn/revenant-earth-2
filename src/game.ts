import { Application, Assets, Container, Graphics, Sprite, Ticker } from "pixi.js";
import { PixelLayer } from "./pixelRendering/pixelLayer";
import { Terrain } from "./world/terrain";
import { System } from "detect-collisions";
import { Player } from "./player";
import { Camera } from "./camera";
import { Vector, Vectorlike } from "./utils/vector";
import { initHandlers, StateManager, StateMode } from "./hierarchy/serialise";
import { Entity } from "./hierarchy/entity";
import { Scene } from "./hierarchy/scene";
import { initComponents } from "./components/componentIndex";
import { ProgressDatabase } from "./hierarchy/progressDatabase";
import { ParticleText } from "./hierarchy/particleText";
import { HackingMinigame } from "./hacking-minigame/hacking";
import { Input, MouseButton } from "./input";
import { TimedShader } from "./shaders/timedShader";
import { UITooltip } from "./ui/tooltip";
import { Prefab } from "./hierarchy/prefabs";
import { Atmo } from "./world/atmo";
import { PlantSpecies } from "./plants/plantSpecies";
import { Plant } from "./components/custom/plant";
import { Weather } from "./world/weather";
import { UI } from "./ui/ui";
import { SoundManager } from "./sound/sound";
import { Debug } from "./dev/debug";
import { HitboxLibrary } from "./environment/hitboxLibrary";
import { displayNumber } from "./utils/utils";
import { Ambience } from "./hierarchy/ambience";
import { Light } from "./shaders/lighting/light";
import { Lightmap } from "./shaders/lighting/lightmap";
import { Shadowmap } from "./shaders/lighting/shadowmap";

export let game: Game;

export class Game {
    static pixelScale = 4;

    elapsedTime = 0;
    debugView = false;

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
    weather!: Weather;

    player!: Player;
    pixelLayer!: PixelLayer;
    entityContainer!: Container;
    terrainContainer!: Container;
    playerContainer!: Container;
    foliageContainer!: Container;
    skyContainer!: Container;
    bgContainer!: Container;
    mainContainer!: Container;
    fgContainer!: Container;
    weatherContainer!: Container;

    skyLayer!: PixelLayer;
    bgLayers: PixelLayer[] = [];
    fgLayer!: PixelLayer;

    collisionSystem!: System;
    tooltip!: UITooltip;

    selectedSeed?: string;

    soundManager = new SoundManager();
    timeScale: number = 1;
    hitboxLibrary = new HitboxLibrary();

    frameHistory: number[] = [];
    ambience!: Ambience;

    public get inputEnabled(): boolean {
        return !Debug.editorMode && !this.hacking
    }

    get worldMouse(): Vectorlike {
        return this.camera.screenToWorld(this.input.mouse.position);
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

                //if (nearest) DevSync.trigger(nearest.toData());
            }
        });
    }

    resize() {
        for (const layer of PixelLayer.resizeLayers) {
            layer.resize(game.camera.pixelScreen.x, game.camera.pixelScreen.y);
        }
        Lightmap.resize();
        Shadowmap.resize();
    }

    async init() {
        (window as any).__PIXI_DEVTOOLS__ = {
            app: this.app
        };
        this.app.renderer.canvas.getContext("webgl2")?.getExtension("EXT_color_buffer_float");
        await Assets.load("./font/monogram.ttf");
        await Assets.add({ alias: "bg", src: "./bg2.png" });
        await Assets.load("bg");
        await Assets.add({ alias: "space", src: "./space.png" });
        await Assets.load("space");
        await this.hitboxLibrary.init();
        await this.soundManager.loadSounds();

        this.stateManager = new StateManager();
        this.progressDatabase = new ProgressDatabase();
        this.stateManager.register(this.progressDatabase);
        this.activeScene = new Scene();
        game.scenes.set(this.activeScene.name, this.activeScene);
        Ambience.deserialise({ kind: "Ambience", ambienceData: { music: "", sound: "wind", background: "bg" } }, this.activeScene);

        initHandlers();
        initComponents();



        new PlantSpecies("Tree", { co2: 1, nutrients: 1, biomass: 1, water: 1, erosion: 1, maxGrowth: 50 },
            { pollution: 1, water: 1, pollutionDamage: 1 }, {
            initialBranches: 1,
            lengthPerGrowth: 4,
            leaves: true
        });
        new PlantSpecies("Grass", { co2: .1, nutrients: .5, biomass: .1, water: .1, erosion: 4, maxGrowth: 7 },
            { pollution: 0, water: 3, pollutionDamage: .5 },
            {
                initialBranches: 8,
                lengthPerGrowth: 2,
                leaves: false
            }
        );


        this.skyContainer = new Container({ parent: this.app.stage });
        this.mainContainer = new Container({ parent: this.app.stage });
        this.fgContainer = new Container({ parent: this.app.stage });
        this.collisionSystem = new System();
        this.camera = new Camera();
        const bg = new Sprite(await Assets.load("./bg.png"));
        bg.scale.set(1);
        //this.app.stage.addChild(bg);

        const scene2 = new Scene();
        scene2.name = "Scene 2";
        game.scenes.set(scene2.name, scene2);
        const s2t = new Array(1000).fill({ x: 0, y: 0 }).map((n, i) => ({ x: i * 10, y: 0 }));
        const s2td = new Array(1000).fill({ pollution: 0, fertility: 0, erosion: 0, moisture: 0 });

        scene2.data = await Assets.load("./scenes/scene-2.json");

        const sceneSpace = Scene.deserialise({ name: "Space Station", kind: "Scene", active: false, data: await Assets.load("./scenes/space-station.json") });

        this.skyLayer = new PixelLayer({ autoResize: true, autoRender: true, depth: 0, parent: this.skyContainer, worldSpace: false });
        const a = new Sprite(await Assets.load("./tree.png"));
        a.scale.set(1);
        this.skyLayer.container.addChild(a);

        const layers = 5;
        for (let i = 0; i < layers; i++) {
            const bgl = new PixelLayer({ autoResize: true, autoRender: true, depth: i / layers, parent: this.skyContainer });
            this.bgLayers.push(bgl);
            bgl.randomTerrain();
        }


        this.pixelLayer = new PixelLayer({ autoResize: true, autoRender: true, depth: 1, parent: this.mainContainer, worldSpace: true });
        this.fgLayer = new PixelLayer({ autoResize: true, autoRender: true, depth: 1.5, parent: this.fgContainer, worldSpace: true });
        this.fgLayer.randomTerrain();

        //this.app.stage.addChild(this.terrainContainer = new Container());
        this.app.stage.addChild((this.playerContainer = new Container()));
        this.pixelLayer.container.addChild((this.bgContainer = new Container()));
        this.pixelLayer.container.addChild((this.entityContainer = new Container()));
        this.pixelLayer.container.addChild((this.terrainContainer = new Container()));
        this.pixelLayer.container.addChild((this.foliageContainer = new Container()));
        this.pixelLayer.container.addChild((this.weatherContainer = new Container()));
        this.app.stage.addChild((Debug.graphicsWorldspace = new Graphics()));
        Debug.graphicsWorldspace.scale.set(Game.pixelScale);

        this.player = new Player();
        this.camera.position.set(this.player.position.x * Game.pixelScale, this.player.position.y * Game.pixelScale);

        this.player.sprite.texture = await Assets.load("./char.png");
        this.player.sprite.texture.source.scaleMode = "nearest";

        Entity.fromData(
            {
                kind: "Entity",
                name: "Robo",
                component: [
                    {
                        componentType: "SpriteDirection",
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
                name: "Door",
                component: [
                    {
                        componentType: "Transform",
                        data: {
                            position: { x: 1000, y: -5 },
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
                            doorId: "dungeon-door-1",
                        },
                    },
                    {
                        componentType: "Pollution",
                        data: {
                            speed: 1,
                            dbName: "pollutionSpeed",
                        },
                    },
                ],
            },
            this.activeScene
        );

        Entity.fromData(
            {
                kind: "Entity",
                name: "Door Space",
                component: [
                    {
                        componentType: "Transform",
                        data: {
                            position: { x: 1150, y: -20 },
                        },
                    },
                    {
                        componentType: "BasicSprite",
                        data: {
                            asset: "./door-space.png",
                        },
                    },
                    {
                        componentType: "Interactable",
                    },
                    {
                        componentType: "Door",
                        data: {
                            target: "Space Station",
                            doorId: "space-door-1",
                        },
                    },
                ],
            },
            this.activeScene
        );

        Prefab.Plant({ scene: this.activeScene, x: 100, y: 100, species: "Tree" });
        Prefab.Plant({ scene: this.activeScene, x: 300, y: 100, species: "Tree" });

        this.tooltip = new UITooltip();

        this.terrain = new Terrain();
        this.activeScene.hasTerrain = true;
        this.atmo = new Atmo();
        this.weather = new Weather();

        this.app.ticker.add(this.update, this);

        Light.init();
        Lightmap.init();

        UI.init();
        Debug.init();
        //game.loadScene("Space Station");
    }

    update(ticker: Ticker) {
        const realDt = Math.min(ticker.elapsedMS / 1000, .1);
        this.frameHistory.push(realDt);
        const avgFrame = this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length;
        while (this.frameHistory.length > 10)
            this.frameHistory.shift();
        Debug.log("fps: " + displayNumber(1 / avgFrame, 0));
        const dt = realDt * this.timeScale;
        this.elapsedTime += dt;
        TimedShader.update(this.elapsedTime);
        Lightmap.update();

        this.tooltip.update(realDt);


        for (const particleText of [...ParticleText.list]) {
            particleText.update(realDt);
        }
        this.activeScene.update(dt);
        this.activeScene.draw(dt);



        this.camera.update(realDt);

        //this.worldDebugGraphics.circle(this.worldMouse.x, this.worldMouse.y, 5);
        //this.worldDebugGraphics.stroke(0x999999);

        for (const layer of PixelLayer.renderLayers) {
            layer.render();
        }

        const address = "http://localhost:3000/state.json";
        if (this.input.keyUp("tab") && !this.input.key("alt")) {
            Debug.editorMode = !Debug.editorMode;
        }

        if (!Debug.editorMode) {
            this.handleNormalInput();
            if (this.hacking) {
                this.hacking.update();
            }
        }
        Debug.debugView = this.input.key("control");
        Debug.update(realDt);

        UI.update();

        //clears input
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

    private handleNormalInput() {
        if (this.input.keyDown("h")) {
            if (this.hacking) this.hacking = this.hacking.close();
            else this.hacking = new HackingMinigame();
        }

        if (this.input.keyDown("m")) {
            UI.fullscreenMenu.toggle();
        }

        if (this.inputEnabled) {
            if (this.input.keyDown("t")) {
                if (!this.selectedSeed) {
                    this.selectedSeed = "Tree";
                }
                else {
                    const array = Array.from(PlantSpecies.species.keys());
                    let index = array.indexOf(this.selectedSeed) + 1;
                    if (index == array.length) index = 0;
                    this.selectedSeed = array[index];
                }
            }
            /*if (this.input.keyDown("q")) {
                let out = this.stateManager.serialise(StateMode.full);
                htcrudSave(address, out);
            }

            if (this.input.keyDown("e")) {
                htcrudLoad(address).then((data) => {
                    this.stateManager.deserialise(data);
                });
            }*/

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
            if (this.input.keyDown("r")) {
                this.weather.weatherData.rainBuildup += 2;
            }
            if (this.input.keyDown("q")) {
                this.terrain.inspectMode++;
                if (this.terrain.inspectMode >= Terrain.inspectModes.length) this.terrain.inspectMode = 0;
                new ParticleText(Terrain.inspectModes[this.terrain.inspectMode], this.player.position);
            }

            if (this.selectedSeed) {
                this.tooltip.hover({ text: "SEED: " + this.selectedSeed });
                if (this.input.mouse.getButtonUp(MouseButton.Left)) {
                    let tree = Prefab.Plant({ x: this.worldMouse.x, y: this.worldMouse.y, species: this.selectedSeed, scene: this.activeScene })!;
                    tree.getComponent(Plant)!.growth = 2;
                    this.selectedSeed = undefined;
                }
                if (this.input.mouse.getButtonUp(MouseButton.Right)) {
                    this.selectedSeed = undefined;
                }
            }
        }
    }
}
