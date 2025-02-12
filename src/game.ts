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
import { initComponents } from "./components/componentIndex";

export let game: Game;

export class Game {
    app: Application;
    keys: { [key: string]: boolean } = {};
    camera!: Camera;
    stateManager!: StateManager;

    terrain!: Terrain;
    robo!: Entity;
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
    pixelScale = 4;

    get worldMouse(): Vectorlike {
        return new Vector().add(this.mousePixels).add(this.camera.worldPosition).sub({ x: this.camera.middle.x / 4, y: this.camera.middle.y / 4 });
    }

    constructor(app: Application) {
        game = this;
        this.app = app;

        document.addEventListener("keydown", e => this.keys[e.key.toLowerCase()] = true);
        document.addEventListener("keyup", e => delete this.keys[e.key.toLowerCase()]);

        document.addEventListener('mousemove', (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
            this.mousePixels.x = Math.round(this.mousePos.x / this.pixelScale);
            this.mousePixels.y = Math.round(this.mousePos.y / this.pixelScale);
        });

        window.addEventListener("resize", () => this.resize());
    }

    resize() {

    }

    async init() {
        this.stateManager = new StateManager();
        initHandlers(this.stateManager);
        initComponents();
        this.collisionSystem = new System();
        this.camera = new Camera();
        const bg = new Sprite(await Assets.load('./bg.png'));
        bg.scale.set(1);
        this.app.stage.addChild(bg);



        this.pixelFG = new PixelLayer(this.app.canvas.width / 4, this.app.canvas.height / 4);
        //this.app.stage.addChild(this.pixelFG.sprite);
        const fg = new Sprite(await Assets.load('./4.png'));
        fg.texture.source.scaleMode = 'nearest';
        fg.scale.set(1);
        this.pixelFG.container.addChild(fg);

        this.pixelLayer = new PixelLayer(this.app.canvas.width / 4, this.app.canvas.height / 4);
        this.app.stage.addChild(this.pixelLayer.sprite);

        //this.app.stage.addChild(this.terrainContainer = new Container());
        this.app.stage.addChild(this.playerContainer = new Container());
        this.terrainContainer = this.pixelLayer.container;
        this.app.stage.addChild(this.worldDebugGraphics = new Graphics());
        this.worldDebugGraphics.scale.set(4);

        this.pixelFG2 = new PixelLayer(this.app.canvas.width / 4, this.app.canvas.height / 4);
        //this.app.stage.addChild(this.pixelFG2.sprite);
        const fg2 = new Sprite(await Assets.load('./5.png'));
        fg2.texture.source.scaleMode = 'nearest';
        fg2.scale.set(1);
        this.pixelFG2.container.addChild(fg2);

        this.player = new Player();
        this.player.sprite.texture = await Assets.load("./char.png");
        this.player.sprite.texture.source.scaleMode = "nearest";

        this.robo = Entity.fromData({
            kind: "Entity",
            id: 0,
            component: [
                {
                    componentType: "SpriteDirectionComponent",
                    id: 0
                },
                {
                    componentType: "BasicSprite",
                    id: 1,
                    data: {
                        asset: "./robo.png"
                    }
                },
                {
                    componentType: "RoboLogic",
                    id: 2
                },
                {
                    componentType: "EntitySerializer",
                    id: 3
                }
            ]
        });

        this.terrain = new Terrain();

        this.app.ticker.add(this.update, this);

    }

    update(ticker: Ticker) {
        const dt = ticker.deltaMS / 1000;

        this.worldDebugGraphics.clear();

        this.robo.emit("update", dt);
        this.robo.emit("draw", dt);

        this.pixelFG.sprite.x = (this.mousePos.x - screen.width / 2) / 10;
        this.pixelFG.sprite.y = (this.mousePos.y - screen.height / 2) / 10;

        this.pixelFG2.sprite.x = (this.mousePos.x - screen.width / 2) / -5;
        this.pixelFG2.sprite.y = (this.mousePos.y - screen.height / 2) / -5;

        this.terrain.update();
        this.player.update(dt);

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
            htcrudLoad(address).then(data => this.stateManager.deserialise(data));
        }
    }
}