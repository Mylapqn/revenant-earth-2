import './style.css'
import { Application, Assets, Point, Sprite, Texture } from 'pixi.js'

const app = new Application();
const player = new Sprite();
const robo = new Sprite();

async function init() {
    await app.init({ background: '#1099bb', resizeTo: window });
    document.body.appendChild(app.canvas);

    const bg = new Sprite(await Assets.load('./bg.png'));
    bg.scale.set(1);
    app.stage.addChild(bg);

    player.texture = await Assets.load('./char.png');
    player.texture.source.scaleMode = 'nearest';
    player.anchor.set(0.5);
    player.scale.set(4);
    player.scale.x *= -1;
    app.stage.addChild(player);

    robo.texture = await Assets.load('./robo.png');
    robo.texture.source.scaleMode = 'nearest';
    robo.anchor.set(0.5);
    robo.scale.set(4);
    app.stage.addChild(robo);

    requestAnimationFrame(update);
}

init();


function update() {

    let x = (player.position.x - robo.position.x)*.01+robo.position.x;
    let y = (player.position.y - robo.position.y)*.01+robo.position.y;
    
    robo.scale.x = x < robo.position.x? -4 : 4;
    robo.position.set(x, y);


    player.x = mousePos.x;
    player.y = mousePos.y;

    app.render();
    requestAnimationFrame(update);
}


const mousePos = { x: 0, y: 0 };

document.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
});
