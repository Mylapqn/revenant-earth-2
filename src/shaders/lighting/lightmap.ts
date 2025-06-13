import fragment from './lightmap.frag?raw';
import vertex from '../vert.vert?raw';
import { RenderTexture, Texture } from 'pixi.js';
import { game } from '../../game';
import { Light } from './light';
import { Shadowmap } from './shadowmap';
import { Vector } from '../../utils/vector';
import { ShaderMesh } from '../shaderMesh';
import { Debug } from '../../dev/debug';

const defaultUniforms = {
    viewport: {
        type: "vec4<f32>",
        value: [0, 0, 0, 0]
    },
    uPixelSize: {
        type: "vec2<f32>",
        value: [0, 0]
    },
    lightAmount: {
        type: "i32",
        value: 0
    }
}

export class Lightmap {
    static fragment: string = fragment;
    static vertex: string = vertex;
    //TODO float texture not doing anything
    static texture: RenderTexture = RenderTexture.create({ format: "rgba32float" });
    static shaderMesh: ShaderMesh;
    static init() {
        Shadowmap.init();
        this.texture.resize(game.camera.pixelScreen.x, game.camera.pixelScreen.y);
        //this.texture.update();
        this.shaderMesh = new ShaderMesh({
            frag: this.fragment,
            customTextures: [{ name: "uShadowMap", texture: Shadowmap.shadowDataTexture }, { name: "uLightData", texture: Light.dataTexture }],
            customUniforms: defaultUniforms,
            size: new Vector(game.camera.pixelScreen.x, game.camera.pixelScreen.y),
            anchor: new Vector(0, 0)
        });
        this.resize();
    }

    static update() {
        Light.updateDataTexture();
        //Shadowmap.update();
        this.shaderMesh.setUniform("uPixelSize", [1 / game.camera.pixelScreen.x, 1 / game.camera.pixelScreen.y]);
        this.shaderMesh.setUniform("lightAmount", Light.list.length);
        this.shaderMesh.setUniform("viewport", [...game.camera.position.xy(), game.camera.pixelScreen.x, game.camera.pixelScreen.y]);
        game.app.renderer.render({ target: this.texture, container: this.shaderMesh });
    }

    static resize() {
        if (game.camera)
            this.texture.resize(game.camera.pixelScreen.x + 2, game.camera.pixelScreen.y + 2);
        this.shaderMesh.resize(game.camera.pixelScreen.x + 2, game.camera.pixelScreen.y + 2);
    }
}