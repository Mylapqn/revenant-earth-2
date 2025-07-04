import fragment from './shadowmap.frag?raw';
import vertex from '../vert.vert?raw';
import { CLEAR, Container, GlTextureSystem, RenderTexture, Sprite } from 'pixi.js';
import { Vector } from '../../utils/vector';
import { CustomColor } from '../../utils/color';
import { game } from '../../game';
import { ShaderMesh } from '../shaderMesh';
import { Debug } from '../../dev/debug';
import { Light } from './light';
import { clamp } from '../../utils/utils';

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

export class Shadowmap {
    static angles = 1024;
    static fragment: string = fragment;
    static vertex: string = vertex;
    static shadowDataTexture: RenderTexture;
    static shaderMesh: ShaderMesh;
    static occluderTexture: RenderTexture;
    static init() {
        console.log("initialising shadowmesh");
        this.occluderTexture = RenderTexture.create({ width: game.camera.pixelScreen.x, height: game.camera.pixelScreen.y });
        this.shadowDataTexture = RenderTexture.create({ width: this.angles, height: Light.maxAmount, format: "r32float" });
        this.shaderMesh = new ShaderMesh({ frag: Shadowmap.fragment, customTextures: [{ name: "occluder", texture: this.occluderTexture }, { name: "uLightData", texture: Light.dataTexture }], customUniforms: defaultUniforms, size: new Vector(this.angles, Light.maxAmount), anchor: new Vector(0, 0) });
        this.resize();
    }
    static clearOccluderTexture() {
        //game.app.renderer.render({ target: this.occluderTexture, clearColor: [0, 0, 0, 0], container: new Container() });
        //game.app.renderer.clear({target: this.occluderTexture, clear: true}); //<-- rozbije ghost??? indexy blbě /útextur?
        //TODO: WTF how is this  working???? @ popeloišky
        Shadowmap.occluderTexture.source.update();
    }
    static update() {
        Light.updateDataTexture();

        this.shaderMesh.setUniform("uPixelSize", [1 / game.camera.pixelScreen.x, 1 / game.camera.pixelScreen.y]);
        this.shaderMesh.setUniform("lightAmount", Light.list.length);
        this.shaderMesh.setUniform("viewport", [...game.camera.position.xy(), game.camera.pixelScreen.x, game.camera.pixelScreen.y]);

        game.app.renderer.render({ target: this.shadowDataTexture, container: this.shaderMesh });
    }
    static resize() {
        //this.occluderTexture.resize(game.camera.pixelScreen.x + 2, game.camera.pixelScreen.y + 2);
        this.occluderTexture = RenderTexture.create({ width: game.camera.pixelScreen.x + 2, height: game.camera.pixelScreen.y + 2 });
        this.shaderMesh.shader.resources.occluder = this.occluderTexture.source;
    }
}
