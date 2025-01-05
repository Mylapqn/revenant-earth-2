import { Graphics } from "pixi.js";
import { Vector, Vectorlike } from "./vector";
import { game } from "./game";
import { Ellipse, Polygon, SATVector } from "detect-collisions";

export class Terrain {
    graphics: Graphics;
    /** including unloaded nodes */
    allNodes: Array<Vector>;
    /** contains only loaded nodes */
    nodes: Vector[];

    hitbox: Polygon;

    constructor() {
        this.graphics = new Graphics();
        this.allNodes = [];
        this.nodes = [];

        let lastHeight = 0;
        for (let index = 0; index < 1000; index++) {
            lastHeight += Math.random() * 5 - 2.5;
            this.allNodes.push(new Vector(10 * index, lastHeight + 100));
        }

        for (let index = 50; index < 100; index++) {
            this.allNodes[index].y -= 500;;
        }

        game.terrainContainer.addChild(this.graphics);
        this.hitbox = game.collisionSystem.createPolygon({ x: 0, y: 0 }, [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
        ]);
    }

    considerNodes() {
        this.nodes = [];

        for (const node of this.allNodes) {
            if (node.x > game.player.position.x - 200 && node.x < game.player.position.x + 200) {
                this.nodes.push(node);
            }
        }

        this.nodes.unshift(new Vector(this.nodes[0].x, 1000));
        this.nodes.push(new Vector(this.nodes[this.nodes.length - 1].x, 1000));
        this.nodes.push(new Vector(this.nodes[0].x, 1000));
        this.hitbox.setPoints(this.nodes.map((node) => new SATVector(node.x, node.y)));
        this.hitbox.updateBody(true);
    }

    update() {
        for (const node of this.nodes) {
            const vec = Vector.fromLike(node);
            if (vec.distance(game.worldMouse) < 20) {
                const dir = vec.diff(game.worldMouse);
                vec.add(dir.normalize().mult(0.5));
                node.x = vec.x;
                node.y = vec.y;
            }
        }

        this.fixTerrain();
        this.considerNodes();
        this.draw();
    }


    fixTerrain() {
        const mergeLimitSq = 5 ** 2;
        const splitLimitSq = 20 ** 2;
        for (let index = 0; index < this.allNodes.length - 1; index++) {
            const node = this.allNodes[index];
            const nextNode = this.allNodes[index + 1];
            if (node.distanceSquared(nextNode) < mergeLimitSq) {
                this.allNodes.splice(index, 1);
                index++;
            } else if (node.distanceSquared(nextNode) > splitLimitSq) {
                const newNode = new Vector((node.x + nextNode.x) / 2, (node.y + nextNode.y) / 2);
                this.allNodes.splice(index + 1, 0, newNode);
                index--;
            }
        }
    }

    draw() {
        this.graphics.clear();

        this.graphics.moveTo(this.nodes[0].x * 4, this.nodes[0].y * 4);
        for (const node of this.nodes) {
            this.graphics.lineTo(node.x * 4, node.y * 4);
        }

        this.graphics.fill(0xccaa99);
    }
}
