import { AnimatedSprite, Spritesheet } from "pixi.js";

export class DynamicAnimatedSprite extends AnimatedSprite {
    spritesheet:Spritesheet;
    constructor(spritesheet: Spritesheet) {
        spritesheet.textureSource.scaleMode = "nearest";
        if (spritesheet.data.meta.frameTags) {
            for (const frameTag of spritesheet.data.meta.frameTags) {
                spritesheet.animations[frameTag.name] = [];
                for (let i = frameTag.from; i <= frameTag.to; i++) {
                    spritesheet.animations[frameTag.name].push(spritesheet.textures[i]);
                }
            }
        }
        super({ textures: [spritesheet.textures[0]], autoUpdate: true});
        AnimatedSprite
        this.animationSpeed = .15;
        this.spritesheet = spritesheet;
    }
    swapAnimation(animationName: string) {
        if (this.textures === this.spritesheet.animations[animationName]) return;
        this.textures = this.spritesheet.animations[animationName];
        this.loop = true;
        this.play();
    }
}