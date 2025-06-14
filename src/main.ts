import { Application } from 'pixi.js';
import { Game } from './game';
import './stylesheets/style.css'
import { DevSync } from './dev/devsync';

async function init() {
    const app = new Application();
    await app.init({ background: '#000000', resizeTo: window, antialias: false, powerPreference: "high-performance",roundPixels:false});
    document.body.appendChild(app.canvas);

    const game = new Game(app);
    await game.init();
    DevSync.init();
}

init();


