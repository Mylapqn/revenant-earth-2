import { Graphics } from "pixi.js";
import { Edge, Vector, Vectorlike } from "./vector";
import { game } from "./game";
import { Ellipse, Polygon, SATVector } from "detect-collisions";
import { TerrainMesh, TerrainNode } from "./terrainNode";

export class Terrain {
    graphics: Graphics;
    terrainMesh: TerrainMesh;
    /** contains only loaded nodes */
    nodes: TerrainNode[];

    hitbox: Polygon;

    constructor() {
        this.graphics = new Graphics();
        this.terrainMesh = new TerrainMesh();
        this.nodes = [];

        let lastHeight = 0;
        for (let index = 0; index < 1000; index++) {
            lastHeight += Math.random() * 5 - 2.5;
            this.terrainMesh.push(new TerrainNode(20 * index, lastHeight + 100));
        }

        let index = 0;
        for (const element of this.terrainMesh) {
            index++;
            if (index > 25 && index < 50) element.add({ x: 0, y: -1000 })
        }

        game.terrainContainer.addChild(this.graphics);
        this.hitbox = game.collisionSystem.createPolygon({ x: 0, y: 0 }, [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
        ]);

        this.considerNodes();

    }

    considerNodes() {
        this.nodes = [];

        for (const node of this.terrainMesh) {
            if (node.x > game.player.position.x - 200 && node.x < game.player.position.x + 200) {
                this.nodes.push(node);
            }
        }

        this.nodes.unshift(new TerrainNode(this.nodes[0].x, 1000));
        this.nodes.push(new TerrainNode(this.nodes[this.nodes.length - 1].x, 1000));
        this.hitbox.setPoints(this.nodes.map((node) => new SATVector(node.x, node.y)));
        this.hitbox.updateBody(true);
    }

    update() {
        /*
        const editedNodes = new Array<TerrainNode>();
        for (const node of this.nodes) {
            if (node.distance(game.worldMouse) < 20) {
                const dir = node.diff(game.worldMouse);
                node.add(dir.normalize().mult(0.5));
                editedNodes.push(node);
            }
        }*/

        this.draw();
        //this.changeFixer(editedNodes);
        this.considerNodes();
    }

    draw() {
        this.graphics.clear();

        this.graphics.moveTo(this.nodes[0].x * 4, this.nodes[0].y * 4);
        for (const node of this.nodes) {
            this.graphics.lineTo(node.x * 4, node.y * 4);
        }

        this.graphics.stroke({ color: 0x0099ff, alpha: 0.5, width: 5 })
        //this.graphics.fill(0xccaa99);
    }

    changeFixer(affectedNodes: Vector[]) {

        // when an edge overlaps with another edge, remove the overlap
        let effectAA = new Vector(-Infinity, -Infinity);
        let effectBB = new Vector(Infinity, Infinity);


        for (const node of affectedNodes) {
            if (node.x < effectAA.x) effectAA.x = node.x;
            if (node.x > effectBB.x) effectBB.x = node.x;
            if (node.y < effectAA.y) effectAA.y = node.y;
            if (node.y > effectBB.y) effectBB.y = node.y;
        }

        const relevantNodes = new Array<Vector>();

        const relevantEdges = new Array<Edge<TerrainNode>>();

        for (const node of this.terrainMesh) {
            if (affectedNodes.includes(node)) {
                continue;
            }

            if (node.x > effectAA.x && node.x < effectBB.x && node.y > effectAA.y && node.y < effectBB.y) {
                relevantNodes.push(node);
                if (node.next) relevantEdges.push(new Edge(node, node.next));
            }
        }

        for (const cedge of relevantEdges) {
            for (const redge of relevantEdges) {
                if (cedge.doesIntersect(redge)) {
                    console.log("intersects");
                    const intersection = cedge.intersection(redge);
                    const node = new TerrainNode(intersection.x, intersection.y);
                    const old1 = cedge.end;

                    cedge.start.next = node;
                    node.next = redge.end;

                    this.graphics.circle(intersection.x * 4, intersection.y * 4, 10);
                    this.graphics.fill({ color: 0x0099ff })
                }
            }
        }

        const splitDistanceSq = 30 ** 2;
        const mergeDistanceSq = 10 ** 2;

        for (const cedge of relevantEdges) {
            const node = cedge.start;
            if (!node.next) continue;

            const dsqrd = node.distanceSquared(node.next);
            if (dsqrd > splitDistanceSq) {
                const newnode = new TerrainNode((node.x + node.next.x) / 2, (node.y + node.next.y) / 2);
                newnode.next = node.next;
                node.next = newnode;
            } else if (dsqrd < mergeDistanceSq) {
                node.next = node.next.next;
            }
        }
    }
}
