import { game, Game } from "../game";
import { nextFrame, sleep } from "../utils/utils";
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
        UIElement.create({ type: "div", classes: ["menu-item"], parent: this.leftMenuElement, content: "Continue", soundEffects: true }).htmlElement.onclick = () => this.continueGame();
        UIElement.create({ type: "div", classes: ["menu-item"], parent: this.leftMenuElement, content: "Options", soundEffects: true }).htmlElement.onclick = () => this.startGame();
        UIElement.create({ type: "div", classes: ["menu-item"], parent: this.leftMenuElement, content: "Credits", soundEffects: true }).htmlElement.onclick = () => this.credits();
        this.parentElement.onmousemove = (e) => this.mouseMove(e);
        this.init();
        MainMenu.instance = this;
    }
    init() {
        this.gameLoadedPromise = game.load();
        this.show();
    }
    async show() {
        this.updating = true;
        this.parentElement.style.display = "flex";
        await this.gameLoadedPromise;
        this.game.soundManager.play("music_menu");
        //game.timeScale = 0;
    }
    hide() {
        this.updating = false;
        this.parentElement.style.display = "none";
        this.game.soundManager.stop("music_menu");
        //game.timeScale = 1;
    }
    update() {
        const now = performance.now();
        const dt = Math.min(now - this.lastFrameStart, 100) / 1000;
        this.lastFrameStart = now;
        this.smoothMouse = Vector.lerp(this.smoothMouse, this.mousePosition, 4 * dt);
        const halfScreen = new Vector(this.parentElement.clientWidth / 2, this.parentElement.clientHeight / 2);
        const bgImgDimensions = new Vector(this.backgroundElement.offsetWidth, this.backgroundElement.offsetHeight);
        const offset = this.smoothMouse.clone().sub(halfScreen).mult(-0.05);
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
        if (game.inited) {
            game.destroyGame();
        }
        await FadeScreen.fadeIn();
        const quote = UIElement.create({ type: "div", classes: ["quote"], parent: FadeScreen.element, content: "We don’t dream of the stars anymore. We dream of wind, fresh air, and water that wasn’t produced in a lab.<p>- Zora Solano, Environmental Technician on UNERA Space Station</p>" });
        this.fadeInElement(quote.htmlElement, 1000);
        this.updating = false;
        this.hide();
        const sleepTimerPromise = sleep(6000);
        if (!game.loaded && this.gameLoadedPromise) {
            await this.gameLoadedPromise;
        }
        await sleepTimerPromise;
        await this.fadeOutElement(quote.htmlElement, 1000);
        await game.init();
        await game.initTutorial();
        await FadeScreen.fadeOut();
        quote.remove();
    }
    async continueGame() {
        if (game.inited) {
            this.hide();
            this.game.initWorld();
            return;
        }
        if (!game.loaded && this.gameLoadedPromise) {
            await this.gameLoadedPromise;
        }
        const gameInit = game.init();
        const fadeScreen = FadeScreen.fadeIn(300);
        this.updating = false;
        if (!game.inited && gameInit) await gameInit;
        this.hide();
        await game.initWorld();
        await fadeScreen;
        await FadeScreen.fadeOut(300);
    }
    async credits() {
        await FadeScreen.fadeIn(300);
        const quote = UIElement.create({ type: "div", classes: ["credits"], parent: FadeScreen.element, content: "<img src='public/logo.svg'><h2>Matouš Marek (Mylapqn)</h2>Concept, design, art, code<h2>Andrej Karovin (NotRustyBot)</h2>Code, advice<br><br><br>Sound effects licenced from Soundly<br><br><br>Thesis supervisor: Pavel Novák<br>FMK TBU Zlín 2025" });
        await this.fadeInElement(quote.htmlElement, 1000);
        await sleep(6000);
        await this.fadeOutElement(quote.htmlElement, 1000);
        await FadeScreen.fadeOut(300);
    }
    async fadeInElement(element: HTMLElement, duration = 1000) {
        element.style.transitionDuration = duration + "ms";
        await nextFrame();
        element.classList.add("appear");
        await sleep(duration);
    }
    async fadeOutElement(element: HTMLElement, duration = 1000) {
        element.style.transitionDuration = duration + "ms";
        element.classList.remove("appear");
        await sleep(duration);
        element.remove();
    }
    static instance?: MainMenu;
}