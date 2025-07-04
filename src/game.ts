import { Application, Assets, AssetsManifest, Container, Graphics, RenderOptions, Sprite, Texture, Ticker, WebGLRenderer } from "pixi.js";
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
import { TooltipPanel, TooltipLegacy } from "./ui/tooltip";
import { Prefab } from "./hierarchy/prefabs";
import { Atmo } from "./world/atmo";
import { PlantSpecies } from "./plants/plantSpecies";
import { Weather } from "./world/weather";
import { UI } from "./ui/ui";
import { SoundManager } from "./sound/sound";
import { Debug } from "./dev/debug";
import { HitboxLibrary } from "./environment/hitboxLibrary";
import { displayNumber, RandomGenerator } from "./utils/utils";
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
import { MainMenu } from "./ui/mainMenu";
import { ItemGroup } from "./itemDefinitions";
import { SceneLibrary } from "./environment/sceneLibrary";
import { ShaderMesh } from "./shaders/shaderMesh";
import planetFrag from "./shaders/planet.frag?raw";
import { Animator } from "./animations/animator";
import { UITooltipManager } from "./ui/uiTooltip";
import { TooltipID } from "./ui/uiTooltipData";

export let game: Game;

export class Game {
    static pixelScale = 4;

    //Time
    elapsedTime = 0;
    timeScale: number = 1;

    //Constructor-time properties
    score: Score;
    animator: Animator;
    app: Application;
    input: Input;

    //Init properties
    stateManager!: StateManager;
    progressDatabase!: ProgressDatabase;
    soundManager = new SoundManager();
    hitboxLibrary = new HitboxLibrary();
    sceneLibrary = new SceneLibrary();
    events!: GameEventSystem;
    milestones!: MilestoneManager;

    //Scenes
    scenes: Map<string, Scene> = new Map<string, Scene>();
    activeScene!: Scene;
    globalScene!: Scene;
    ambience!: Ambience;

    //Rendering
    camera!: Camera;

    //Containers
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
    backgroundTextures!: Set<Texture>;

    //PixelLayers
    pixelLayer!: PixelLayer;
    skyLayer!: PixelLayer;
    bgLayers: PixelLayer[] = [];
    worldUiLayer!: PixelLayer;

    //Game
    player!: Player;
    hacking?: HackingMinigame;
    collisionSystem!: System;

    //Environment
    terrain!: Terrain;
    atmo!: Atmo;
    weather!: Weather;

    //UI
    tooltipManager!: UITooltipManager;
    tooltipLegacy!: TooltipLegacy;
    buildingGhost!: BuildingGhost;
    currentBuildable?: Buildable;
    selectedSeed?: string;

    //Debug
    frameHistory: number[] = [];
    debugView = false;

    planet!: ShaderMesh;
    planetContainer: Container;
    planetRenderer: WebGLRenderer;

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
        this.animator = new Animator();
        this.score = new Score();
        this.planetContainer = new Container();
        this.planetRenderer = new WebGLRenderer();
    }

    resize() {
        this.camera.resize();
        for (const layer of PixelLayer.resizeLayers) {
            layer.resize(game.camera.pixelScreen.x, game.camera.pixelScreen.y);
        }
        Lightmap.resize();
        Shadowmap.resize();
    }

    async preload() {
        await this.soundManager.loadMenuSounds();
    }

    async load() {
        if (this.loaded) return;
        const startTime = performance.now();
        const manifest: AssetsManifest = {
            bundles: [
                {
                    name: "bundle", assets: [
                        { alias: "player_anim", src: "./anim/player2.json" },
                        { alias: "director_anim", src: "./anim/director.json" },
                        { alias: "bg", src: "./bg3.png" },
                        { alias: "metal_bg", src: "./interior_bg.png" },
                        { alias: "space", src: "./space_tile.png" },
                        { alias: "monogram", src: "./font/monogram.ttf" },
                        { alias: "biochar", src: "./gfx/building/biochar.png" },
                        { alias: "planter", src: "./gfx/building/planter.png" },
                        { alias: "planter_inspect", src: "./gfx/building/planter_mask.png" },
                        { alias: "sprinkler", src: "./gfx/building/water_sprinkler.png" },
                        { alias: "sprinkler_active", src: "./gfx/building/water_sprinkler_active.png" },
                        { alias: "solar_panel", src: "./gfx/building/solar_panel.png" },
                        { alias: "battery", src: "./gfx/building/battery.png" },
                        { alias: "barrel_1", src: "./gfx/building/barrel_1.png" },
                        { alias: "barrel_2", src: "./gfx/building/barrel_2.png" },
                        { alias: "floor", src: "./floor.png" },
                        { alias: "interior_bg", src: "./interior_bg.png" },
                        { alias: "water_tank", src: "./gfx/building/water_tank.png" },
                        { alias: "window", src: "./window.png" },
                        { alias: "chest", src: "./gfx/building/chest.png" },
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
        const bundle = await Assets.loadBundle(["bundle"]);
        if (bundle.bundle) {
            for (const asset of Object.values(bundle.bundle)) {
                if (asset instanceof Texture) asset.source.scaleMode = 'nearest';
            }
        }
        console.log("Loading backgrounds", performance.now() - startTime);
        this.backgroundTextures = new Set(Object.values((await Assets.loadBundle(["backgrounds"])).backgrounds));
        console.log("Loading hitboxes and scenes", performance.now() - startTime);
        await this.hitboxLibrary.init();
        await this.sceneLibrary.init();
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



        new PlantSpecies("Black poplar", { co2: 1, nutrients: 1, biomass: 1, water: 1.5, erosion: 1, maxGrowth: 50 },
            { pollution: 3, water: 1, pollutionDamage: .02, grassiness: 0 },
            {
                initialBranches: 1,
                lengthPerGrowth: 4,
                leaves: true
            });
        Buildable.plantBuildable(PlantSpecies.species.get("Black poplar")!);
        new PlantSpecies("Vetiver grass", { co2: .1, nutrients: .5, biomass: .1, water: .1, erosion: 4, maxGrowth: 7 },
            { pollution: 0, water: 3, pollutionDamage: .5, grassiness: 1 },
            {
                initialBranches: 8,
                lengthPerGrowth: 2,
                leaves: false
            }
        );
        Buildable.plantBuildable(PlantSpecies.species.get("Vetiver grass")!);
        new PlantSpecies("Sea buckthorn", { co2: .1, nutrients: .2, biomass: .5, water: .01, erosion: 2, maxGrowth: 20 },
            { pollution: 1, water: .2, pollutionDamage: .1, grassiness: 0 },
            {
                initialBranches: 1,
                lengthPerGrowth: 2,
                leaves: true
            }
        );
        Buildable.plantBuildable(PlantSpecies.species.get("Sea buckthorn")!);

        await Buildable.initBuildables();


        this.skyContainer = new Container({ parent: this.app.stage });
        this.mainContainer = new Container({ parent: this.app.stage });
        this.fgContainer = new Container({ parent: this.app.stage });
        this.collisionSystem = new System();
        this.camera = new Camera();
        const bg = new Sprite(await Assets.load("./bg.png"));
        bg.scale.set(1);
        //this.app.stage.addChild(bg);

        Scene.deserialise({ name: "Seed Vault", kind: "Scene", active: false, data: this.sceneLibrary.get("seed-dungeon") });
        Scene.deserialise({ name: "Factory", kind: "Scene", active: false, data: this.sceneLibrary.get("factory-dungeon") });
        Scene.deserialise({ name: "Space Station", kind: "Scene", active: false, data: this.sceneLibrary.get("space-station") });

        this.skyLayer = new PixelLayer({ autoResize: true, autoRender: true, depth: 0, parent: this.skyContainer, worldSpace: false });

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


        const planetSize = game.camera.pixelScreen.y * .8;

        await this.planetRenderer.init({ backgroundAlpha: 0, antialias: false, powerPreference: "high-performance", roundPixels: false, width: planetSize, height: planetSize });
        UI.fullscreenTabMenu.htmlElement.appendChild(this.planetRenderer.canvas);
        this.planetRenderer.canvas.classList.add("planet-canvas");
        this.planetRenderer.canvas.style.width = `${planetSize * Game.pixelScale}px`;
        this.planetRenderer.canvas.style.height = `${planetSize * Game.pixelScale}px`;

        const planetLayer = new PixelLayer({ autoResize: true, worldSpace: false, autoRender: true, parent: this.app.stage });

        const planetTex = await Assets.load("./planet/earth_height_map_blur.png") as Texture;
        planetTex.source.scaleMode = "linear";
        this.planet = new ShaderMesh({
            frag: planetFrag, parent: this.planetContainer, size: new Vector(planetSize, planetSize), anchor: { x: 0, y: 0 },
            customUniforms: {
                uLightPosition: {
                    type: "vec3<f32>", value: [0, 1, 1]
                },
                uAtmosphereQuality: {
                    type: "f32", value: 0
                },
                uTerrainQuality: {
                    type: "f32", value: 0
                }
            },
            texture: planetTex
        });
        //this.planet.position.set(this.camera.pixelScreen.x - planetSize / 2 - 10, planetSize / 2 + 10);

        this.player.sprite.texture = await Assets.load("./char.png");
        this.player.sprite.texture.source.scaleMode = "nearest";

        this.defaultScene();


        Entity.fromData({
            kind: "Entity", name: "Global",
            component: [
                {
                    componentType: "Inventory",
                    data: {
                        items: {
                            "solarPanel": 0,
                            "grass": 0,
                            "tree": 2,
                            "bush": 0,
                            "biocharKiln": 0,
                            "battery": 0,
                            "sprinkler": 0,
                        }
                    }
                }
            ]
        }, this.globalScene);

        this.tooltipLegacy = new TooltipLegacy();
        this.tooltipManager = new UITooltipManager();

        this.terrain = new Terrain();
        this.activeScene.hasTerrain = true;
        this.atmo = new Atmo();
        this.weather = new Weather();



        this.score.init();
        this.milestones.initQuests();
        Debug.init();
        //game.loadScene("Space Station");
        for (let x = 0; x < this.terrain.totalWidth; x += Math.random() * 300 + 50) {
            Prefab.Plant({ scene: this.activeScene, x: x, y: 100, species: "Black poplar", growth: 30, health: 0 });
        }
        for (let x = 0; x < this.terrain.totalWidth; x += Math.random() * 80 + 10) {
            Prefab.Plant({ scene: this.activeScene, x: x, y: 100, species: "Vetiver grass", growth: 5, health: 0 });
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
        const dt = realDt * this.timeScale * (!this.input.key("g") ? 1 : 4);
        this.elapsedTime += dt;

        TimedShader.update(this.elapsedTime);
        this.planet.setUniform("uLightPosition", [...this.camera.screenToCentered(this.input.mouse.position).xy(), 1 - this.camera.screenToCentered(this.input.mouse.position).length() * 2]);

        this.uiGraphics.clear();
        this.worldUiGraphics.clear();
        Shadowmap.clearOccluderTexture();

        this.score.update(dt);

        this.tooltipManager.update(dt);
        this.tooltipLegacy.update(realDt);

        if (this.input.key("-")) {
            let out = prompt("spawn");
            if (out) Debug.prefab(out);
        }

        if (this.dataCollectionTimer <= 0) {
            this.dataCollectionTimer = this.collectionFrequency;
            this.dataCollectionTick();
        } else {
            this.dataCollectionTimer -= dt;
        }


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

        this.planetRenderer.render({ container: this.planetContainer, clear: false } as RenderOptions);


        const address = "http://localhost:3000/state.json";
        if (this.input.keyUp(";") && !this.input.key("alt")) {
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


    graphableData = new Array<{
        temp: number;
        co2: number;
        averageAirPollution: number;
        averageGroundPollution: number;
        averageGrassiness: number
    }>
    dataCollectionTimer = 0;
    collectionFrequency = 5;
    lookback = 120;
    public dataCollectionTick() {
        if (this.activeScene.name != "Scene") return;
        const data = this.currentData();

        const atmoQuality = 1 - data.averageAirPollution;
        const terrainQuality = data.averageGrassiness;
        this.planet.setUniform("uAtmosphereQuality", atmoQuality);
        this.planet.setUniform("uTerrainQuality", terrainQuality);

        if (this.graphableData.length == 0) {
            for (let i = 0; i < this.lookback; i++) {
                this.graphableData.push(data);
            }
        } else {
            const data = this.currentData();
            this.graphableData.push(data);
            if (this.graphableData.length > this.lookback) this.graphableData.shift();
            if (UI.fullscreenMenu.visible) UI.fullscreenMenu.renderProgress();
        }
    }

    private tempGraph = new Graphics();
    private co2Graph = new Graphics();
    private averageAirPollutionGraph = new Graphics();
    private averageGroundPollutionGraph = new Graphics();

    async getGraphs(): Promise<{
        temp: { img: HTMLImageElement, value: string, trend: number, tooltip: TooltipID },
        co2: { img: HTMLImageElement, value: string, trend: number, tooltip: TooltipID },
        averageAirPollution: { img: HTMLImageElement, value: string, trend: number, tooltip: TooltipID },
        averageGroundPollution: { img: HTMLImageElement, value: string, trend: number, tooltip: TooltipID },
    }> {
        function graphData(g: Graphics, data: number[], max = 1) {
            g.clear();
            const height = 75;
            const width = 120;
            g.rect(0, 0, width, height);
            g.fill({ color: 0x000000, alpha: 0.0 });
            for (let i = 0; i < data.length; i++) {
                const value = (data[i]) / max;
                const x = i / (data.length - 1) * width;
                const y = height - value * (height - 4) + 2;
                if (i == 0) {
                    g.moveTo(x, y);
                } else {
                    g.lineTo(x, y);
                }
            }
            g.stroke({ color: 0xffffff, width: 2 });
        }

        graphData(this.tempGraph, this.graphableData.map(d => d.temp), 60);
        graphData(this.co2Graph, this.graphableData.map(d => d.co2), 800);
        graphData(this.averageAirPollutionGraph, this.graphableData.map(d => d.averageAirPollution));
        graphData(this.averageGroundPollutionGraph, this.graphableData.map(d => d.averageGroundPollution));

        const out = await Promise.all([
            this.app.renderer.extract.image(this.tempGraph),
            this.app.renderer.extract.image(this.co2Graph),
            this.app.renderer.extract.image(this.averageAirPollutionGraph),
            this.app.renderer.extract.image(this.averageGroundPollutionGraph),
        ]);

        const lastIndex = this.graphableData.length - 1;
        const secondLastIndex = this.graphableData.length - 2;

        return {
            temp: { img: out[0], value: `${this.graphableData[lastIndex].temp.toFixed(1)}°C`, trend: Math.sign(this.graphableData[lastIndex].temp - this.graphableData[secondLastIndex].temp), tooltip: TooltipID.airTemperature },
            co2: { img: out[1], value: `${this.graphableData[lastIndex].co2.toFixed(0)}ppm`, trend: Math.sign(this.graphableData[lastIndex].co2 - this.graphableData[secondLastIndex].co2), tooltip: TooltipID.airCo2 },
            averageAirPollution: { img: out[2], value: `${Math.round(this.graphableData[lastIndex].averageAirPollution * 100)}%`, trend: Math.sign(this.graphableData[lastIndex].averageAirPollution - this.graphableData[secondLastIndex].averageAirPollution), tooltip: TooltipID.airPollution },
            averageGroundPollution: { img: out[3], value: `${Math.round(this.graphableData[lastIndex].averageGroundPollution * 100)}%`, trend: Math.sign(this.graphableData[lastIndex].averageGroundPollution - this.graphableData[secondLastIndex].averageGroundPollution), tooltip: TooltipID.soilToxicity },
        };
    }

    private currentData() {
        const data: typeof this.graphableData[0] = {
            temp: game.atmo.celsius,
            co2: game.atmo.co2,
            averageAirPollution: game.atmo.atmoData.reduce((a, b) => a + b.pollution, 0) / game.atmo.atmoData.length,
            averageGroundPollution: game.terrain.terrainData.reduce((a, b) => a + b.pollution, 0) / game.terrain.terrainData.length,
            averageGrassiness: game.terrain.terrainData.reduce((a, b) => a + b.grassiness, 0) / game.terrain.terrainData.length
        }
        return data;
    }

    private handleNormalInput() {
        if (this.input.keyDown("h")) {
            if (this.hacking) this.hacking = this.hacking.close();
            else this.hacking = new HackingMinigame();
        }

        if (this.input.keyDown("tab")) {
            UI.fullscreenMenu.toggle();
            //let stats = "";
            //for (const fc of Object.entries(game.atmo.energyMoveTotal)) {
            //    stats += `${fc[0]}: ${displayNumber(fc[1], 2)}<br>`;
            //}
            //UI.fullscreenMenu.element.innerHTML = stats;
        }

        if (this.input.keyDown("m")) {
            UI.fullscreenTabMenu.toggle();
        }

        if (this.input.keyDown("e") || this.input.mouse.getButtonUp(MouseButton.Wheel)) {
            UI.quickInventory!.toggle();
        }

        if (this.inputEnabled) {
            if (this.input.keyDown("t")) {
                UI.quickInventory!.currentGroup = ItemGroup.Seed;
                UI.quickInventory!.toggle();
            }
            if (this.input.keyDown("b")) {
                UI.quickInventory!.currentGroup = ItemGroup.Building;
                UI.quickInventory!.toggle();
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

            if (this.input.keyDown("r")) {
                this.weather.weatherData.rainBuildup += 2;
            }
            if (this.input.keyDown("escape")) {
                if (UI.fullscreenMenu.visible) UI.fullscreenMenu.toggle();
                else {
                    if (MainMenu.instance?.updating) {
                        MainMenu.instance.continueGame();
                    }
                    else {
                        game.loadScene("Menu");
                        MainMenu.instance?.show();
                    }
                }
            }
            if (this.input.keyDown("č")) {
                this.weather.weatherData.dayTime += this.weather.dayLength / 8;
            }
            /*if (this.input.keyDown("q")) {
                this.terrain.inspectMode++;
                if (this.terrain.inspectMode >= Terrain.inspectModes.length) this.terrain.inspectMode = 0;
                new ParticleText(Terrain.inspectModes[this.terrain.inspectMode], this.player.position);
            }*/

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
                    this.tooltipLegacy.hover(...tooltips);
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
                name: "Seed Dungeon Door",
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
                            target: "Seed Vault",
                            doorId: "seed-dungeon",
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
                name: "Factory Door",
                component: [
                    {
                        componentType: "Transform",
                        data: {
                            position: { x: 4300, y: -5 },
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
                            target: "Factory",
                            doorId: "factory-dungeon",
                        },
                    },
                    {
                        componentType: "Pollution",
                        data: {
                            speed: 1,
                            dbName: "Factory Switch",
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
                name: "Factory",
                component: [
                    {
                        componentType: "Transform",
                        data: {
                            position: { x: 4300, y: -40 },
                        },
                    },
                    {
                        componentType: "BasicSprite",
                        data: {
                            asset: "./gfx/bg/factory.png",
                            container: "bg",
                        },
                    },
                    {
                        componentType: "TerrainAlign",
                        data: {
                            yOffset: 55,
                        },
                    }
                ],
            },
            this.activeScene
        );

        Entity.fromData(
            {
                kind: "Entity",
                name: "Landing Pod",
                component: [
                    {
                        componentType: "Transform",
                        data: {
                            position: { x: 2000, y: -20 },
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

        for (let x = 0; x < 10; x++) {
            Prefab.Polluter({ scene: this.activeScene, x: 3200 + x * 100 + Math.random() * 90, pollution: 10 });
        }
    }
}
