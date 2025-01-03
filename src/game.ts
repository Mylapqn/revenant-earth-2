import { Application, Assets, Sprite, Ticker } from "pixi.js";
import { PixelLayer } from "./pixelRendering/pixelLayer";
import { PixelSprite } from "./pixelRendering/pixelSprite";

export let game: Game;

export class Game {
    app: Application;
    keys: { [key: string]: boolean } = {};

    player!: PixelSprite;
    robo!: Sprite;
    pixelLayer!: PixelLayer;
    pixelFG!:PixelLayer;
    pixelFG2!:PixelLayer;

    mousePos = { x: 0, y: 0 };

    constructor(app: Application) {
        game = this;
        this.app = app;

        document.addEventListener("keydown", e => this.keys[e.key.toLowerCase()] = true);
        document.addEventListener("keyup", e => delete this.keys[e.key.toLowerCase()]);

        document.addEventListener('mousemove', (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
        });

        window.addEventListener("resize", () => this.resize());
    }

    resize() {

    }

    async init() {
        const bg = new Sprite(await Assets.load('./bg.png'));
        bg.scale.set(1);
        this.app.stage.addChild(bg);

        this.pixelLayer = new PixelLayer(this.app.canvas.width / 4, this.app.canvas.height / 4);
        this.app.stage.addChild(this.pixelLayer.sprite);

        this.pixelFG = new PixelLayer(this.app.canvas.width / 4, this.app.canvas.height / 4);
        this.app.stage.addChild(this.pixelFG.sprite);
        const fg = new Sprite(await Assets.load('./4.png'));
        fg.texture.source.scaleMode = 'nearest';
        fg.scale.set(1);
        this.pixelFG.container.addChild(fg);

        this.pixelFG2 = new PixelLayer(this.app.canvas.width / 4, this.app.canvas.height / 4);
        this.app.stage.addChild(this.pixelFG2.sprite);
        const fg2 = new Sprite(await Assets.load('./5.png'));
        fg2.texture.source.scaleMode = 'nearest';
        fg2.scale.set(1);
        this.pixelFG2.container.addChild(fg2);


        this.robo = new Sprite();
        this.robo.texture = await Assets.load('./robo.png');
        this.robo.texture.source.scaleMode = 'nearest';
        this.robo.anchor.set(0.5);
        this.pixelLayer.container.addChild(this.robo);

        this.player = new PixelSprite();
        this.player.texture = await Assets.load('./char.png');
        this.player.texture.source.scaleMode = 'nearest';
        this.player.anchor.set(0.5);
        //player.scale.set(4);
        this.player.scale.x *= -1;
        this.pixelLayer.container.addChild(this.player);

        this.app.ticker.add(this.update, this);

    }

    update(ticker: Ticker) {
        const dt = ticker.deltaMS / 1000;

        let x = (this.player.position.x - this.robo.position.x) * .01 + this.robo.position.x;
        let y = (this.player.position.y - this.robo.position.y) * .01 + this.robo.position.y;

        this.robo.scale.x = x < this.robo.position.x ? -1 : 1;
        this.robo.position.set(x, y);


        this.player.x = this.mousePos.x / 4;
        this.player.y = this.mousePos.y / 4;

        this.pixelFG.sprite.x = (this.mousePos.x - screen.width / 2)/10;
        this.pixelFG.sprite.y = (this.mousePos.y - screen.height / 2)/10;

        this.pixelFG2.sprite.x = (this.mousePos.x - screen.width / 2)/-5;
        this.pixelFG2.sprite.y = (this.mousePos.y - screen.height / 2)/-5;

        this.pixelLayer.render();
        this.pixelFG.render();
        this.pixelFG2.render();
        this.app.render();
    }


}