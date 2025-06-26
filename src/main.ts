import { Application } from 'pixi.js';
import { Game } from './game';
import './stylesheets/style.css';
import './stylesheets/menu.css';
import './stylesheets/inventory.css';
import './stylesheets/quest.css';
import './stylesheets/hacking.css';
import './stylesheets/mainMenu.css';
import './stylesheets/progress.css';
import { DevSync } from './dev/devsync';
import { MainMenu } from './ui/mainMenu';
import { FadeScreen } from './ui/fadeScreen';
import { UI } from './ui/ui';
import { UIQuickInventory } from "./ui/uiQuickInventory";
import { nextFrame } from './utils/utils';

async function init() {
    const start = performance.now();
    const app = new Application();
    await app.init({ background: '#000000', resizeTo: window, antialias: false, powerPreference: "high-performance", roundPixels: false });
    document.body.appendChild(app.canvas);

    document.addEventListener('contextmenu', event => event.preventDefault());
    document.addEventListener('dragstart', event => event.preventDefault());

    console.log("load")
    FadeScreen.init();
    const game = new Game(app);
    await game.preload();
    const loadingTook = performance.now() - start;
    if(loadingTook > 1000){
        await FadeScreen.fadeIn(100);
        FadeScreen.fadeOut();
    }
    document.getElementById("loading-screen")?.remove();
    const menu = new MainMenu(game);
    await menu.init(false);
    console.log("done")


    //DevSync.init();
}

window.addEventListener("load", () => { init() });


