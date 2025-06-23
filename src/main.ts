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
    const app = new Application();
    await app.init({ background: '#000000', resizeTo: window, antialias: false, powerPreference: "high-performance", roundPixels: false });
    document.body.appendChild(app.canvas);

    document.addEventListener('contextmenu', event => event.preventDefault());
    document.addEventListener('dragstart', event => event.preventDefault());

    FadeScreen.init();
    const game = new Game(app);
    const menu = new MainMenu(game);
    await menu.init(false);

    //DevSync.init();
}

init();


