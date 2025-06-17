import { AnimatedSprite, Spritesheet } from "pixi.js";

/**
 * Accepts Spritesheets exported from Aseprite with the "Hash" type and "Meta: Tags" enabled.
 */
export class DynamicAnimatedSprite extends AnimatedSprite {
    spritesheet: Spritesheet;
    constructor(spritesheet: Spritesheet) {
        const namesArray = Object.keys(spritesheet.data.frames);
        spritesheet.textureSource.scaleMode = "nearest";
        if (spritesheet.data.meta.frameTags) {
            for (const frameTag of spritesheet.data.meta.frameTags) {
                spritesheet.animations[frameTag.name] = [];
                for (let i = frameTag.from; i <= frameTag.to; i++) {
                    spritesheet.animations[frameTag.name].push(spritesheet.textures[namesArray[i]]);
                }
            }
        }
        super({ textures: [spritesheet.textures[namesArray[0]]], autoUpdate: true });
        this.animationSpeed = .15;
        this.spritesheet = spritesheet;
        this.swapAnimation(spritesheet.data.meta.frameTags![0].name);
    }
    swapAnimation(animationName: string) {
        if (this.textures === this.spritesheet.animations[animationName]) return;
        this.textures = this.spritesheet.animations[animationName];
        this.loop = true;
        this.play();
    }
}