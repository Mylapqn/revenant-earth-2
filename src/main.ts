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
import { UI, UIQuickInventory } from './ui/ui';

async function init() {
    const app = new Application();
    await app.init({ background: '#000000', resizeTo: window, antialias: false, powerPreference: "high-performance",roundPixels:false});
    document.body.appendChild(app.canvas);
    
    document.addEventListener('contextmenu', event => event.preventDefault());
    document.addEventListener('dragstart', event => event.preventDefault());

    FadeScreen.init();
    const game = new Game(app);
    //new MainMenu(game);
    await game.load();
    await game.init();
    await game.initWorld();
    //DevSync.init();
}

init();


