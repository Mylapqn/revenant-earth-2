import { Graphics } from "pixi.js";
import { Vectorlike } from "./types";
import { game } from "./game";
import { Ellipse, Polygon, SATVector } from "detect-collisions";

export class Terrain {
    graphics: Graphics;
    /** including unloaded nodes */
    allNodes: Vectorlike[];
    /** contains only loaded nodes */
    nodes: Vectorlike[];

    hitbox: Polygon;

    constructor() {
        this.graphics = new Graphics();
        this.allNodes = [];
        this.nodes = [];

        for (let index = 0; index < 100; index++) {
            this.allNodes.push({ x: 100 * index, y: Math.random() * 50 + 100 });
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

        this.nodes.unshift({ x: this.nodes[0].x, y: 1000 });
        this.nodes.push({ x: this.nodes[this.nodes.length - 1].x, y: 1000 });
        this.nodes.push({ x: this.nodes[0].x, y: 1000 });
        this.hitbox.setPoints(this.nodes.map((node) => new SATVector(node.x, node.y)));
        this.hitbox.updateBody(true);
    }

    update() {
        this.considerNodes();
        this.draw();
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
