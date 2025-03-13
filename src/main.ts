import { Application } from 'pixi.js';
import { Game } from './game';
import './style.css'

async function init() {
    const app = new Application();
    await app.init({ background: '#1099bb', resizeTo: window, antialias: false, powerPreference: "high-performance",roundPixels:false});
    document.body.appendChild(app.canvas);

    const game = new Game(app);
    await game.init();
}

init();



