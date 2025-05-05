import { rad2deg, SATVector } from "detect-collisions";
import { Vector } from "../utils/vector";
import { Game, game } from "../game";
import { Geometry } from "pixi.js";
import { ParticleText } from "../hierarchy/particleText";
import { clamp, displayNumber } from "../utils/utils";

export type HitboxGeneratorOptions = { points: SATVector[], uvOffset?: number, flipDirection?: boolean, depth?: number, perspectiveDepth?: number, customAttributes?: any, UVWidth?: number };

export class HitboxGeometry extends Geometry {
    constructor(options: HitboxGeneratorOptions) {
        const { positions, uvs } = HitboxGeometry.getPositions(options);
        super({ attributes: Object.assign({ aPosition: positions, aUV: uvs }, options.customAttributes), topology: 'triangle-strip' });
    }
    static getPositions(options: HitboxGeneratorOptions) {
        const positions: number[] = [];
        const uvs: number[] = [];
        const depth = options.depth ?? 30;
        const uvWidth = options.UVWidth;
        const perspective = options.perspectiveDepth ?? 0;
        const uvOffset = options.uvOffset ?? 0;
        let uvX = 0;

        for (let i = 1; i < options.points.length - 1; i++) {
            const node = options.points[i];
            const tangentLeft = options.points[i].clone().sub(options.points[i - 1]).normalize();
            const tangentRight = options.points[i + 1].clone().sub(options.points[i]).normalize();
            const normal = tangentLeft.clone().add(tangentRight).normalize();
            const halfAngle = Math.acos((clamp(Vector.dot(tangentLeft.clone().reverse(), tangentRight), -1, 1))) / 2;
            const normalFactor = 1 / Math.sin(halfAngle);
            normal.perp().reverse();
            const innerPoint = node.clone().add(normal.clone().scale(depth * normalFactor));
            if (perspective > 0) {
                const camDiff = new SATVector((node.x - game.camera.position.x / Game.pixelScale), (node.y - game.camera.position.y / Game.pixelScale));
                camDiff.scale(perspective);
                innerPoint.add(camDiff);
            }

            positions.push(node.x, node.y, innerPoint.x, innerPoint.y);
            if (uvWidth) {
                uvs.push((uvOffset + uvX) * 1, 0, (uvOffset + uvX) * 1, 1);
                uvX += options.points[i + 1].clone().sub(options.points[i]).len() / uvWidth;
            }
            else {
                uvs.push((uvOffset + i) * 20 / depth, 0, (uvOffset + i) * 20 / depth, 1);
            }
        }
        return { positions, uvs };
    }
}