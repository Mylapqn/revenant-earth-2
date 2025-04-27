import { Application, Assets, Color, Container, Graphics, Sprite, Texture, Ticker } from "pixi.js";
import { PixelLayer } from "./pixelRendering/pixelLayer";
import { Terrain } from "./world/terrain";
import { System } from "detect-collisions";
import { Player } from "./player";
import { Camera } from "./camera";
import { Vector, Vectorlike } from "./utils/vector";
import { initHandlers, StateManager, StateMode } from "./hierarchy/serialise";
import { htcrudLoad, htcrudSave } from "./dev/htcrud-helper";
import { Entity } from "./hierarchy/entity";
import { Scene } from "./hierarchy/scene";
import doorHitbox from "./environment/doorHitbox.json";
import interior from "./environment/hitbox.json";
import { initComponents } from "./components/componentIndex";
import { ProgressDatabase } from "./hierarchy/progressDatabase";
import { ParticleText } from "./hierarchy/particleText";
import { DevSync } from "./dev/devsync";
import { Hitbox } from "./components/generic/hitbox";
import { BasicSprite } from "./components/generic/basicSprite";
import { HackingMinigame } from "./hacking-minigame/hacking";
import { Input, MouseButton } from "./input";
import { TimedShader } from "./shaders/timedShader";
import { TooltipPanel, UITooltip } from "./ui/tooltip";
import { Prefab } from "./hierarchy/prefabs";
import { Atmo } from "./world/atmo";
import { displayNumber } from "./utils/utils";
import { PlantSpecies } from "./plants/plantSpecies";
import { Plant } from "./components/custom/plant";
import { Weather } from "./world/weather";
import { CloudMesh } from "./world/cloudMesh";
import { CustomColor } from "./utils/color";

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
    weather!: Weather;

    player!: Player;
    pixelLayer!: PixelLayer;
    terrainContainer!: Container;
    playerContainer!: Container;
    foliageContainer!: Container;
    bgContainer!: Container;
    mainContainer!: Container;
    fgContainer!: Container;
    worldDebugGraphics!: Graphics;
    weatherContainer!: Container;

    bgLayer!: PixelLayer;
    bgLayers: PixelLayer[] = [];

    collisionSystem!: System;
    tooltip!: UITooltip;

    selectedSeed?: string;

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

    resize() {
        for (const layer of PixelLayer.resizeLayers) {
            layer.resize(game.camera.pixelScreen.x, game.camera.pixelScreen.y);
        }
    }

    async init() {
        await Assets.load("./font/monogram.ttf");
        this.stateManager = new StateManager();
        this.progressDatabase = new ProgressDatabase();
        this.stateManager.register(this.progressDatabase);
        this.activeScene = new Scene();
        game.scenes.set(this.activeScene.name, this.activeScene);

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


        this.bgContainer = new Container({ parent: this.app.stage });
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
                            velocity: { x: 0, y: 0 },
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
                            velocity: { x: 0, y: 0 },
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
                            velocity: { x: 0, y: 0 },
                        },
                    },
                    {
                        componentType: "Hitbox",
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

        this.bgLayer = new PixelLayer({ autoResize: true, autoRender: true, depth: 0, parent: this.bgContainer,worldSpace:false });
        const a = new Sprite(await Assets.load("./tree.png"));
        a.scale.set(1);
        this.bgLayer.container.addChild(a);

        const layers = 5;
        for (let i = 0; i < layers; i++) {
            const bgl = new PixelLayer({ autoResize: true, autoRender: true, depth: i / layers, parent: this.bgContainer });
            this.bgLayers.push(bgl);
            const bgg = new Graphics({ parent: bgl.container });
            let y = 0;
            bgg.moveTo(0,1000);
            bgg.lineTo(0,y);
            const width = 256;
            for (let t = 0; t < width; t++) {
                y += (Math.random()-.5)*5;
                bgg.lineTo(t*5,y);
            }
            bgg.lineTo(width*5,1000);
            bgg.fill(new CustomColor(255*i / layers,255*i / layers,255*i / layers));
        }


        this.pixelLayer = new PixelLayer({ autoResize: true, autoRender: true, depth: 1, parent: this.mainContainer, worldSpace: true });


        //this.app.stage.addChild(this.terrainContainer = new Container());
        this.app.stage.addChild((this.playerContainer = new Container()));
        this.pixelLayer.container.addChild((this.terrainContainer = new Container()));
        this.pixelLayer.container.addChild((this.foliageContainer = new Container()));
        this.pixelLayer.container.addChild((this.weatherContainer = new Container()));
        this.app.stage.addChild((this.worldDebugGraphics = new Graphics()));
        this.worldDebugGraphics.scale.set(Game.pixelScale);

        this.player = new Player();
        this.camera.position.set(this.player.position.x*Game.pixelScale, this.player.position.y*Game.pixelScale);

        this.player.sprite.texture = await Assets.load("./char.png");
        this.player.sprite.texture.source.scaleMode = "nearest";

        Entity.fromData(
            {
                kind: "Entity",
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

        Prefab.Tree({ scene: this.activeScene, x: 100, y: 100, species: "Tree" });
        Prefab.Tree({ scene: this.activeScene, x: 300, y: 100, species: "Tree" });

        this.tooltip = new UITooltip();

        this.terrain = new Terrain();
        this.atmo = new Atmo();
        this.weather = new Weather();

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

        if (this.input.key("control")) {
            for (let x = 0; x < this.terrain.nodes.length; x++) {
                const node = this.terrain.nodes[x];
                const tdata = this.terrain.getProperties(node.x);
                const adata = this.atmo.getProperties(node.x);
                if (tdata == undefined) continue;
                this.worldDebugGraphics.circle(node.x, node.y, adata.pollution * 10);
                this.worldDebugGraphics.stroke({ width: 1, color: new Color({ r: 255, g: 100, b: 0, a: 1 }) });
            }
        }


        this.camera.update(dt);

        this.worldDebugGraphics.circle(this.worldMouse.x, this.worldMouse.y, 5);
        this.worldDebugGraphics.stroke(0x999999);

        for (const layer of PixelLayer.renderLayers) {
            layer.render();
        }


        const address = "http://localhost:3000/state.json";

        if (this.input.keyDown("h")) {
            if (this.hacking) this.hacking = this.hacking.close();
            else this.hacking = new HackingMinigame();
        }

        if (this.hacking) {
            this.hacking.update();
        }
        else {
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
                this.terrain.inspectMode ++;
                if(this.terrain.inspectMode >= Terrain.inspectModes.length) this.terrain.inspectMode = 0;
                new ParticleText(Terrain.inspectModes[this.terrain.inspectMode], this.player.position);
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
                    const hitbox = nearest.getComponent(Hitbox);
                    if (hitbox) {
                    }
                }
                const columns: TooltipPanel[] = [];
                let text = "";
                text += "CO2: " + displayNumber(this.atmo.co2, 2) + "\n";
                text += "TEMP: " + displayNumber(this.atmo.celsius, 2) + "\n";
                Object.entries(this.atmo.getProperties(this.worldMouse.x)).forEach(([key, value]) => text += `${key}: ${displayNumber(value, 2)}\n`);
                columns.push({ title: "Atmo", text: text });
                text = "";
                Object.entries(this.terrain.getProperties(this.worldMouse.x)).forEach(([key, value]) => text += `${key}: ${displayNumber(value, 2)}\n`);
                columns.push({ title: "Terrain", text: text });
                text = "";
                Object.entries(this.weather.weatherData).forEach(([key, value]) => text += `${key}: ${displayNumber(value, 2)}\n`);
                columns.push({ title: "Weather", text: text });
                this.tooltip.hover(
                    { title: "Debug data" },
                    { text: "X: " + Math.floor(this.worldMouse.x) + " // Y: " + Math.floor(this.worldMouse.y), highlight: true },
                    { text: "" + game.pixelLayer.sprite.x },
                    { columns: columns }
                )
            }
            if (this.selectedSeed) {
                this.tooltip.hover({ text: "SEED: " + this.selectedSeed });
                if (this.input.mouse.getButtonUp(MouseButton.Left)) {
                    let tree = Prefab.Tree({ x: this.worldMouse.x, y: this.worldMouse.y, species: this.selectedSeed, scene: this.activeScene })!;
                    tree.getComponent(Plant)!.growth = 2;
                    this.selectedSeed = undefined;
                }
                if (this.input.mouse.getButtonUp(MouseButton.Right)) {
                    this.selectedSeed = undefined;
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
