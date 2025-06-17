import { game, Game } from "../game";
import { Vector } from "../utils/vector";
import { FadeScreen } from "./fadeScreen";
import { UIElement } from "./ui";

export class MainMenu {
    game: Game;
    parentElement: HTMLElement;
    backgroundElement: HTMLImageElement;
    logoElement: HTMLImageElement;
    mousePosition: Vector = new Vector();
    gameLoadedPromise?: Promise<void>;
    smoothMouse: Vector = new Vector();
    leftMenuElement: HTMLElement;
    lastFrameStart: number = 0;
    private _updating = false;
    public get updating() {
        return this._updating;
    }
    public set updating(value) {
        if (value == this._updating) return;
        this._updating = value;
        if (value) requestAnimationFrame(this.update.bind(this));
    }
    constructor(game: Game) {
        this.game = game;
        this.parentElement = UIElement.create({ type: "div", classes: ["main-menu"], parent: document.body }).htmlElement;
        this.backgroundElement = UIElement.create({ type: "img", classes: ["bg"], parent: this.parentElement }).htmlElement as HTMLImageElement;
        this.backgroundElement.src = "public/space_menu.png";
        this.logoElement = UIElement.create({ type: "img", classes: ["logo"], parent: this.parentElement }).htmlElement as HTMLImageElement;
        this.logoElement.src = "public/logo.svg";
        this.leftMenuElement = UIElement.create({ type: "div", classes: ["left-menu"], parent: this.parentElement }).htmlElement;
        UIElement.create({ type: "div", classes: ["menu-item"], parent: this.leftMenuElement, content: "Play", soundEffects: true }).htmlElement.onclick = () => this.startGame();
        UIElement.create({ type: "div", classes: ["menu-item"], parent: this.leftMenuElement, content: "Options", soundEffects: true }).htmlElement.onclick = () => this.startGame();
        UIElement.create({ type: "div", classes: ["menu-item"], parent: this.leftMenuElement, content: "Credits", soundEffects: true }).htmlElement.onclick = () => this.startGame();
        this.parentElement.onmousemove = (e) => this.mouseMove(e);
        this.init();
    }
    init() {
        this.gameLoadedPromise = game.load();
        this.updating = true;
    }
    show() {

    }
    hide() {
        this.updating = false;
    }
    update() {
        const now = performance.now();
        const dt = Math.min(now - this.lastFrameStart, 100) / 1000;
        this.lastFrameStart = now;
        this.smoothMouse = Vector.lerp(this.smoothMouse, this.mousePosition, 4 * dt);
        const halfScreen = new Vector(this.parentElement.clientWidth / 2, this.parentElement.clientHeight / 2);
        const bgImgDimensions = new Vector(this.backgroundElement.offsetWidth, this.backgroundElement.offsetHeight);
        const offset = this.smoothMouse.clone().sub(halfScreen).mult(0.05);
        const bgImgOffset = new Vector(halfScreen.x - bgImgDimensions.x / 2, 0).add(offset);
        const logoOffset = bgImgOffset.clone().add(bgImgDimensions.clone().vecmult({ x: 0.53, y: -0.16 })).add(offset.clone().mult(-0.5));
        this.backgroundElement.style.left = `${bgImgOffset.x}px`;
        this.backgroundElement.style.top = `${bgImgOffset.y}px`;
        this.logoElement.style.left = `${logoOffset.x}px`;
        this.logoElement.style.top = `${logoOffset.y}px`;
        this.logoElement.style.width = `${bgImgDimensions.x * .3}px`;
        if (this.updating) requestAnimationFrame(this.update.bind(this));
    }
    mouseMove(e: MouseEvent) {
        if (this.updating) this.mousePosition.set(e.clientX, e.clientY);
    }
    async startGame() {
        await FadeScreen.fadeIn();
        this.updating = false;
        this.parentElement.remove();
        if (!game.loaded && this.gameLoadedPromise) {
            await this.gameLoadedPromise;
        }
        await game.init();
        await FadeScreen.fadeOut();
    }
}