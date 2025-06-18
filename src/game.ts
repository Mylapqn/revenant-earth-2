import { Application, Assets, AssetsBundle, AssetsManifest, ColorMatrixFilter, Container, Graphics, Sprite, Texture, Ticker } from "pixi.js";
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
import { TooltipPanel, UITooltip } from "./ui/tooltip";
import { Prefab } from "./hierarchy/prefabs";
import { Atmo } from "./world/atmo";
import { PlantSpecies } from "./plants/plantSpecies";
import { Plant } from "./components/custom/plant";
import { Weather } from "./world/weather";
import { UI } from "./ui/ui";
import { SoundManager } from "./sound/sound";
import { Debug } from "./dev/debug";
import { HitboxLibrary } from "./environment/hitboxLibrary";
import { displayNumber, RandomGenerator, sleep } from "./utils/utils";
import { Ambience } from "./hierarchy/ambience";
import { Light } from "./shaders/lighting/light";
import { Lightmap } from "./shaders/lighting/lightmap";
import { Shadowmap } from "./shaders/lighting/shadowmap";
import { Score } from "./hierarchy/score";
import { GameEventSystem } from "./hierarchy/eventSystem";
import { BuildingGhost } from "./hierarchy/buildingGhost";
import { Buildable } from "./hierarchy/buildable";
import { MilestoneManager } from "./hierarchy/milestoneManager";
import { QuestMarker } from "./ui/questMarker";
import { FadeScreen } from "./ui/fadeScreen";
import { MainMenu } from "./ui/mainMenu";

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
    globalScene!: Scene;

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
    uiContainer!: Container;
    uiGraphics!: Graphics;
    worldUiContainer!: Container;
    worldUiGraphics!: Graphics;

    skyLayer!: PixelLayer;
    bgLayers: PixelLayer[] = [];
    //fgLayer!: PixelLayer;
    worldUiLayer!: PixelLayer;

    buildingGhost!: BuildingGhost;
    currentBuildable?: Buildable;

    collisionSystem!: System;
    tooltip!: UITooltip;

    selectedSeed?: string;

    soundManager = new SoundManager();
    timeScale: number = 1;
    hitboxLibrary = new HitboxLibrary();

    frameHistory: number[] = [];
    ambience!: Ambience;

    events!: GameEventSystem;
    milestones!: MilestoneManager;

    score: Score;
    backgroundTextures!: Set<Texture>;

    loaded = false;
    inited = false;

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

        this.score = new Score();
    }

    resize() {
        this.camera.resize();
        for (const layer of PixelLayer.resizeLayers) {
            layer.resize(game.camera.pixelScreen.x, game.camera.pixelScreen.y);
        }
        Lightmap.resize();
        Shadowmap.resize();
    }

    async load() {
        const startTime = performance.now();
        const manifest: AssetsManifest = {
            bundles: [
                {
                    name: "bundle", assets: [
                        { alias: "player_anim", src: "./anim/player2.json" },
                        { alias: "director_anim", src: "./anim/director.json" },
                        { alias: "bg", src: "./bg2.png" },
                        { alias: "metal_bg", src: "./interior_bg.png" },
                        { alias: "space", src: "./space_tile.png" },
                        { alias: "monogram", src: "./font/monogram.ttf" },
                        { alias: "biochar", src: "./gfx/building/biochar.png" },
                        { alias: "planter", src: "./gfx/building/planter.png" },
                        { alias: "planter_inspect", src: "./gfx/building/planter_mask.png" },
                        { alias: "sprinkler", src: "./gfx/building/water_sprinkler.png" },
                        { alias: "sprinkler_active", src: "./gfx/building/water_sprinkler_active.png" },
                    ]
                },
                {
                    name: "backgrounds", assets: [
                        { alias: "ruin_factory_1", src: "./gfx/bg/1/ruin_factory_1.png" },
                        { alias: "ruin_house_1", src: "./gfx/bg/1/ruin_house_1.png" },
                        { alias: "ruin_house_2", src: "./gfx/bg/1/ruin_house_2.png" },
                        { alias: "ruin_hway_1", src: "./gfx/bg/1/ruin_hway_1.png" },
                        { alias: "ruin_pole_1", src: "./gfx/bg/1/ruin_pole_1.png" },
                        { alias: "ruin_pole_2", src: "./gfx/bg/1/ruin_pole_2.png" },
                    ]
                }
            ]
        }
        console.log("Loading bundle", performance.now() - startTime);
        Assets.init({ manifest });
        await Assets.loadBundle(["bundle"]);
        Assets.get("sprinkler_active").source.scaleMode = 'nearest';
        Assets.get("sprinkler").source.scaleMode = 'nearest';
        console.log("Loading backgrounds", performance.now() - startTime);
        this.backgroundTextures = new Set(Object.values((await Assets.loadBundle(["backgrounds"])).backgrounds));
        console.log("Loading hitboxes", performance.now() - startTime);
        await this.hitboxLibrary.init();
        console.log("Loading sounds", performance.now() - startTime);
        await this.soundManager.loadSounds();
        const endTime = performance.now();
        console.log("Game loaded in", endTime - startTime, "ms");
        this.loaded = true;
    }

    /**
     * Initializes the game. Can only be called after `load()`.
     */
    async init() {
        if (!this.loaded) throw new Error("Game not loaded");
        if (this.inited) throw new Error("Game already initialized");
        (window as any).__PIXI_DEVTOOLS__ = {
            app: this.app
        };

        window.addEventListener("resize", () => this.resize());

        window.addEventListener("beforeunload", (e) => {
            if (this.input.key("control") && !this.input.key("r")) e.preventDefault();
        });

        document.addEventListener("contextmenu", (e) => e.preventDefault());

        this.app.renderer.canvas.getContext("webgl2")?.getExtension("EXT_color_buffer_float");
        this.scenes = new Map<string, Scene>();
        this.bgLayers = [];

        this.events = new GameEventSystem();
        this.milestones = new MilestoneManager();

        this.stateManager = new StateManager();
        this.progressDatabase = new ProgressDatabase();
        this.stateManager.register(this.progressDatabase);
        this.globalScene = new Scene();
        this.globalScene.name = "Global";
        this.activeScene = new Scene();
        game.scenes.set(this.activeScene.name, this.activeScene);
        game.scenes.set("Menu", new Scene());
        Ambience.deserialise({ kind: "Ambience", ambienceData: { music: "", sound: "wind", background: "bg", ambientColor: [1.5, 1, .5] } }, this.activeScene);
        //this.soundManager.soundLibrary.stop("wind");
        initHandlers();
        initComponents();



        new PlantSpecies("Tree", { co2: 1, nutrients: 1, biomass: 1, water: 1, erosion: 1, maxGrowth: 50 },
            { pollution: 1, water: 1, pollutionDamage: 1 }, {
            initialBranches: 1,
            lengthPerGrowth: 4,
            leaves: true
        });
        Buildable.plantBuildable(PlantSpecies.species.get("Tree")!);
        new PlantSpecies("Grass", { co2: .1, nutrients: .5, biomass: .1, water: .1, erosion: 4, maxGrowth: 7 },
            { pollution: 0, water: 3, pollutionDamage: .5 },
            {
                initialBranches: 8,
                lengthPerGrowth: 2,
                leaves: false
            }
        );
        Buildable.plantBuildable(PlantSpecies.species.get("Grass")!);

        await Buildable.initBuildables();


        this.skyContainer = new Container({ parent: this.app.stage });
        this.mainContainer = new Container({ parent: this.app.stage });
        this.fgContainer = new Container({ parent: this.app.stage });
        this.collisionSystem = new System();
        this.camera = new Camera();
        const bg = new Sprite(await Assets.load("./bg.png"));
        bg.scale.set(1);
        //this.app.stage.addChild(bg);

        const scene2 = Scene.deserialise({ name: "Scene 2", kind: "Scene", active: false, data: await Assets.load("./scenes/scene-2.json") });
        const sceneSpace = Scene.deserialise({ name: "Space Station", kind: "Scene", active: false, data: await Assets.load("./scenes/space-station.json") });

        this.skyLayer = new PixelLayer({ autoResize: true, autoRender: true, depth: 0, parent: this.skyContainer, worldSpace: false });
        const a = new Sprite(await Assets.load("./tree.png"));
        a.scale.set(1);
        this.skyLayer.container.addChild(a);

        const layers = 5;
        for (let i = 0; i < layers; i++) {
            const bgl = new PixelLayer({ autoResize: true, autoRender: true, depth: i / layers, parent: this.skyContainer });
            this.bgLayers.push(bgl);
            if (i >= layers - 3)
                bgl.randomTerrainWithSprites(this.backgroundTextures);
            else {
                bgl.randomTerrain();
            }
        }


        this.pixelLayer = new PixelLayer({ autoResize: true, autoRender: true, depth: 1, parent: this.mainContainer, worldSpace: true });
        //this.fgLayer = new PixelLayer({ autoResize: true, autoRender: true, depth: 1.5, parent: this.fgContainer, worldSpace: true });
        //this.fgLayer.randomTerrain(40);

        //this.app.stage.addChild(this.terrainContainer = new Container());
        this.app.stage.addChild((this.playerContainer = new Container()));
        this.pixelLayer.container.addChild((this.bgContainer = new Container()));
        this.pixelLayer.container.addChild((this.entityContainer = new Container()));
        this.pixelLayer.container.addChild((this.terrainContainer = new Container()));
        this.pixelLayer.container.addChild((this.foliageContainer = new Container()));
        this.pixelLayer.container.addChild((this.weatherContainer = new Container()));
        Debug.containerWorldspace = new Container({ parent: this.app.stage, scale: { x: Game.pixelScale, y: Game.pixelScale } });
        Debug.graphicsWorldspace = new Graphics({ parent: Debug.containerWorldspace });

        this.uiContainer = new Container({ parent: this.app.stage });
        this.uiGraphics = new Graphics({ parent: this.uiContainer });
        this.worldUiLayer = new PixelLayer({ autoResize: true, autoRender: true, depth: 1, parent: this.uiContainer, worldSpace: true, lighting: false });
        this.worldUiContainer = this.worldUiLayer.container;
        this.worldUiGraphics = new Graphics({ parent: this.worldUiContainer });

        this.buildingGhost = new BuildingGhost();

        Light.init();
        Lightmap.init();

        UI.init();
        QuestMarker.init();

        this.player = new Player();
        this.camera.position.set(this.player.position.x * Game.pixelScale, this.player.position.y * Game.pixelScale);

        this.player.sprite.texture = await Assets.load("./char.png");
        this.player.sprite.texture.source.scaleMode = "nearest";

        this.defaultScene();


        Entity.fromData({
            kind: "Entity", name: "Global",
            component: [
                {
                    componentType: "Inventory",
                    data: {}
                }
            ]
        }, this.globalScene);

        this.tooltip = new UITooltip();

        this.terrain = new Terrain();
        this.activeScene.hasTerrain = true;
        this.atmo = new Atmo();
        this.weather = new Weather();



        this.score.init();
        this.milestones.initQuests();
        Debug.init();
        //game.loadScene("Space Station");
        for (let x = 0; x < this.terrain.totalWidth; x += Math.random() * 300 + 50) {
            Prefab.Plant({ scene: this.activeScene, x: x, y: 100, species: "Tree", growth: 30, health: 0 });
        }
        for (let x = 0; x < this.terrain.totalWidth; x += Math.random() * 80 + 10) {
            Prefab.Plant({ scene: this.activeScene, x: x, y: 100, species: "Grass", growth: 5, health: 0 });
        }
        const rand = new RandomGenerator();
        for (let x = 0; x < this.terrain.totalWidth; x += Math.random() * 30 + 10) {
            Prefab.Rock({ scene: this.activeScene, x: x, y: 100, type: rand.int(0, 5) });
        }
        this.resize();
        this.app.ticker.add(this.update, this);
        this.inited = true;
    }

    async initTutorial() {
        this.loadScene("Space Station");
        this.camera.zoom = 2;
        this.camera.targetZoom = 2;
        this.camera.zoomSpeed = .3;
        this.camera.position.set(this.camera.targetPlayerPosition());

        setTimeout(() => {
            this.milestones.issueQuest("tutorial", true);
            this.camera.targetZoom = 1.5;
        }, 1000)
    }

    async initWorld() {
        this.loadScene("Scene");
        this.camera.position.set(this.camera.targetPlayerPosition());
        this.milestones.currentTier = 1;
    }

    destroyGame() {
        this.app.ticker.remove(this.update, this);
        this.app.stage.removeChildren();
        UI.destroy();
        window.removeEventListener("resize", this.resize);
        window.removeEventListener("beforeunload", (e) => {
            if (this.input.key("control") && !this.input.key("r")) e.preventDefault();
        });
        document.removeEventListener("contextmenu", (e) => e.preventDefault());
        this.inited = false;
    }

    update(ticker: Ticker) {
        const realDt = Math.min(ticker.elapsedMS / 1000, .04);
        this.frameHistory.push(realDt);
        const avgFrame = this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length;
        while (this.frameHistory.length > 10)
            this.frameHistory.shift();
        if (Debug.editorMode)
            Debug.log("fps: " + displayNumber(1 / avgFrame, 0));
        const dt = realDt * this.timeScale * (!this.input.key("g") ? 1 : .2);
        this.elapsedTime += dt;

        TimedShader.update(this.elapsedTime);

        this.uiGraphics.clear();
        this.worldUiGraphics.clear();
        Shadowmap.clearOccluderTexture();

        this.score.update(dt);

        this.tooltip.update(realDt);



        this.camera.processPosition(dt);
        this.camera.processZoom(realDt);
        for (const particleText of [...ParticleText.list]) {
            particleText.update(dt);
        }
        this.activeScene.update(dt);
        this.activeScene.drawShadow(dt);
        Shadowmap.update();
        Lightmap.update();
        this.activeScene.draw(dt);

        this.camera.applyRender(realDt);



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
            this.buildingGhost.update();
            if (this.hacking) {
                this.hacking.update();
            }
        }
        Debug.debugView = this.input.key("control");
        Debug.update(realDt);

        UI.update();
        QuestMarker.update();
        this.milestones.popups.update();


        //clears input
        this.input.update();
    }

    loadScene(name: string) {
        this.activeScene.serialise(StateMode.full);
        this.scenes.get(name)!.load();
        return this.activeScene;
    }

    nearestEntity(position: Vectorlike) {
        let nearest = undefined;
        let nearestDistance = Infinity;
        for (const entity of game.activeScene.objects) {
            if (entity instanceof Entity && this.camera.inView(entity.transform.position, 50)) {
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
            //let stats = "";
            //for (const fc of Object.entries(game.atmo.energyMoveTotal)) {
            //    stats += `${fc[0]}: ${displayNumber(fc[1], 2)}<br>`;
            //}
            //UI.fullscreenMenu.element.innerHTML = stats;
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
                Buildable.activate(this.selectedSeed);

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

            if (this.input.keyDown("c")) {
                Buildable.activate("Sprinkler");
            }

            if (this.input.keyDown("+")) {
                if (this.activeScene.name != "Scene") {
                    this.loadScene("Scene");
                }
            }
            if (this.input.keyDown("r")) {
                this.weather.weatherData.rainBuildup += 2;
            }
            if (this.input.keyDown("escape")) {
                if(MainMenu.instance?.updating) {
                    MainMenu.instance.continueGame();
                }
                else {
                    game.loadScene("Menu");
                    MainMenu.instance?.show();
                }
            }
            if (this.input.keyDown("č")) {
                this.weather.weatherData.dayTime += this.weather.dayLength / 8;
            }
            if (this.input.keyDown("q")) {
                this.terrain.inspectMode++;
                if (this.terrain.inspectMode >= Terrain.inspectModes.length) this.terrain.inspectMode = 0;
                new ParticleText(Terrain.inspectModes[this.terrain.inspectMode], this.player.position);
            }

            if (this.currentBuildable) {
                const result = this.currentBuildable.checkPosition(this.worldMouse);
                if (result.valid) {
                    this.buildingGhost.valid = result.warning ? 1 : 2;
                    this.buildingGhost.snap = result.snap;
                    if (this.input.mouse.getButtonUp(MouseButton.Left)) {
                        const entity = this.currentBuildable.onBuild(result.snap!);
                        this.events.emit("playerBuild", entity);
                        this.currentBuildable.deactivate();
                    }
                }
                else {
                    this.buildingGhost.valid = 0;
                    this.buildingGhost.snap = undefined;
                }
                if (this.input.mouse.getButtonUp(MouseButton.Right)) {
                    this.currentBuildable.deactivate();
                }
                if (this.currentBuildable) {
                    const tooltips: TooltipPanel[] = [{ text: this.currentBuildable.name, highlight: true }];
                    if (result.reason && !result.valid) tooltips.push({ text: "CANNOT PLACE: " + result.reason, customClasses: ["error"] });
                    if (result.reason && result.valid) tooltips.push({ text: result.reason });
                    if (result.warning) tooltips.push({ text: "WARNING:\n" + result.warning, customClasses: ["warning"] });
                    this.tooltip.hover(...tooltips);
                }
            }
        }
    }
    defaultScene() {
        /*Entity.fromData(
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
);*/

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
                    {
                        componentType: "TerrainAlign",
                        data: {
                            yOffset: 20,
                        },
                    }
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
                            asset: "./landing.png",
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
                            enabled: false
                        },
                    },
                    {
                        componentType: "TerrainAlign",
                        data: {
                            yOffset: 20,
                        },
                    },
                    {
                        componentType: "Trigger",
                        data: {
                            name: "planetLanding"
                        },
                    },
                ],
            },
            this.activeScene
        );
    }
}
