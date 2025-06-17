import { Application } from 'pixi.js';
import { Game } from './game';
import './stylesheets/style.css';
import './stylesheets/menu.css';
import './stylesheets/inventory.css';
import './stylesheets/quest.css';
import './stylesheets/hacking.css';
import './stylesheets/mainMenu.css';
import { DevSync } from './dev/devsync';
import { MainMenu } from './ui/mainMenu';
import { FadeScreen } from './ui/fadeScreen';

async function init() {
    const app = new Application();
    await app.init({ background: '#000000', resizeTo: window, antialias: false, powerPreference: "high-performance",roundPixels:false});
    document.body.appendChild(app.canvas);

    FadeScreen.init();
    const game = new Game(app);
    new MainMenu(game);
    //await game.init();
    //DevSync.init();
}

init();


