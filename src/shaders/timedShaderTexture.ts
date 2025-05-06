import { Shader, ShaderWithResources, Texture, TextureShader, TextureSource } from "pixi.js";
import { TimedShader } from "./timedShader";

export class TimedTextureShader extends TimedShader implements TextureShader {
    private _texture: Texture;
    public get texture(): Texture {
        return this._texture;
    }
    public set texture(value: Texture) {
        value.source.scaleMode = "nearest";
        this._texture = value;
        this.resources.uSampler = value.source;
    }
    constructor(options: ShaderWithResources & { texture?: Texture }) {
        super(options);
        this._texture = options.texture ?? Texture.WHITE;
    }
}
