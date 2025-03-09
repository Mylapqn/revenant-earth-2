import { Graphics } from "pixi.js";
import { Edge, Vector, Vectorlike } from "./vector";
import { game } from "./game";
import { Ellipse, Polygon, SATVector } from "detect-collisions";
import { TerrainMesh, TerrainNode } from "./terrainNode";
import { ISerializable, ObjectKind, StateMode } from "./hierarchy/serialise";
import { ISceneObject, Scene } from "./hierarchy/scene";

export class Terrain implements ISerializable, ISceneObject {
    graphics: Graphics;
    terrainMesh: TerrainMesh;
    /** contains only loaded nodes */
    nodes: TerrainNode[];

    hitbox: Polygon;

    terrainData = new Array<TerrainData>();
    readonly dataWidth = 10;

    totalWidth = 2000;

    constructor() {
        game.activeScene.register(this);
        this.graphics = new Graphics();
        this.terrainMesh = new TerrainMesh();
        this.nodes = [];

        game.terrainContainer.addChild(this.graphics);
        this.hitbox = game.collisionSystem.createPolygon({ x: 0, y: 0 }, [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
        ]);

        this.defaultTerrain();
    }

    unload() {
        game.activeScene.unregister(this);
    }

    static deserialise(raw: any, scene?: Scene) {
        const data = raw as { kind: string; terrainMesh: Array<Vectorlike>; terrainData: Array<TerrainData> };
        game.terrain.terrainMesh = new TerrainMesh();
        for (const node of data.terrainMesh) {
            game.terrain.terrainMesh.push(new TerrainNode(node.x, node.y));
        }

        game.terrain.terrainData = data.terrainData;

        game.terrain.considerNodes();
        if (scene) scene.register(game.terrain);
    }

    defaultTerrain() {
        let lastHeight = 0;
        for (let index = 0; index < 1000; index++) {
            lastHeight += Math.random() * 5 - 2.5;
            this.terrainMesh.push(new TerrainNode(20 * index, lastHeight + 100));
        }

        let index = 0;
        for (const element of this.terrainMesh) {
            index++;
            if (index > 25 && index < 50) element.add({ x: 0, y: -1000 });
        }

        for (let index = 0; index < this.totalWidth; index += this.dataWidth) {
            this.terrainData.push({ pollution: 0, fertility: 0, erosion: 0, moisture: 0 });
        }

        this.considerNodes();
    }

    serialise(mode: StateMode): false | { kind: ObjectKind; terrainMesh: Array<Vectorlike>; terrainData: Array<TerrainData> } {
        let nodes = [];
        for (const node of this.terrainMesh) {
            nodes.push({ x: Math.round(node.x), y: Math.round(node.y) });
        }

        return { kind: "Terrain", terrainMesh: nodes, terrainData: this.terrainData };
    }

    considerNodes() {
        this.nodes = [];

        for (const node of this.terrainMesh) {
            if (node.x > game.player.position.x - 200 && node.x < game.player.position.x + 200) {
                this.nodes.push(node);
            }
        }
        if(this.nodes.length < 2) return;
        this.nodes.unshift(new TerrainNode(this.nodes[0].x, 1000));
        this.nodes.push(new TerrainNode(this.nodes[this.nodes.length - 1].x, 1000));
        this.hitbox.setPoints(this.nodes.map((node) => new SATVector(node.x, node.y)));
        this.hitbox.updateBody(true);
    }

    update() {
        this.graphics.clear();

        const editedNodes = new Set<TerrainNode>();
        let prev = this.nodes[0];
        for (const node of this.nodes) {
            if (node.distance(game.worldMouse) < 20) {
                const dir = node.diff(game.worldMouse);
                node.add(dir.normalize().mult(0.5));
                editedNodes.add(node);
                editedNodes.add(prev);
                if (node.next) editedNodes.add(node.next);
            }
            prev = node;
        }

        this.draw();

        if (game.keys["x"]) {
            const data = this.getProperties(game.worldMouse.x);
            data.fertility = Math.min(1, data.fertility + 0.1);
        }

        this.updateProperties();

        this.changeFixer(editedNodes);
        this.considerNodes();
    }

    private spread(a: TerrainData, b: TerrainData) {
        if (a.fertility > 0.01) {
            const half = (a.fertility - 0.01) * .05;
            b.fertility += half;
            a.fertility -= half;
        }
        if (a.pollution > 0.5 && b.pollution < a.pollution) {
            const half = (a.pollution) * .005;
            b.pollution += half;
            a.pollution -= half;
        }
    }

    getProperties(x: number) {
        const a = this.terrainData[Math.round(x / this.dataWidth)];
        return a;
    }

    updateProperties() {
        for (let index = 0; index < this.terrainData.length - 1; index++) {
            const a = this.terrainData[index];
            const b = this.terrainData[index + 1];
            this.spread(a, b);
        }

        for (let index = this.terrainData.length - 1; index > 0; index--) {
            const a = this.terrainData[index];
            const b = this.terrainData[index - 1];
            this.spread(a, b);
        }
    }

    draw() {
        if (this.nodes.length < 2) return;
        this.graphics.moveTo(this.nodes[0].x, this.nodes[0].y);

        for (const node of this.hitbox.points) {
            this.graphics.lineTo(node.x, node.y);
        }

        this.graphics.fill(0x552211);
        this.graphics.stroke({ color: 0x889944, alpha: 1, width: 1 });

        for (const node of this.hitbox.points) {
            const x = Math.round(node.x / this.dataWidth) * this.dataWidth;
            const data = this.getProperties(x);
            //this.graphics.rect(node.x, node.y, 10, data.fertility * 100);
            //this.graphics.moveTo(node.x, node.y);
            //this.graphics.lineTo(node.x, node.y + data.fertility * 20);
            if (data == undefined) continue;
            this.graphics.lineTo(node.x, node.y + data.fertility * 20);

            let r = Math.floor(Math.max(0, Math.min(1, (1 - data.fertility) * 2)) * 255)
                .toString(16)
                .padStart(2, "0");
            let g = Math.floor(Math.max(0, Math.min(1, data.fertility * 2)) * 255)
                .toString(16)
                .padStart(2, "0");

            this.graphics.stroke({ color: `0x${r}${g}00`, alpha: 1, width: 1 });
        }

        /*for (let index = -20; index < 20; index++) {
            const x = (Math.round(game.player.position.x / this.dataWidth) + index) * this.dataWidth
            const data = this.getProperties(x);
            this.graphics.rect(x, game.player.position.y - 500, this.dataWidth, 1000);
            this.graphics.fill({ color: 0x00ff00, alpha: data.fertility });
        }*/
    }

    changeFixer(affectedNodes: Set<TerrainNode>) {
        // when an edge overlaps with another edge, remove the overlap
        let effectAA = new Vector(Infinity, Infinity);
        let effectBB = new Vector(-Infinity, -Infinity);

        if (game.keys["p"]) {
            console.log("pressed p");
        }

        for (const node of affectedNodes) {
            if (node.x < effectAA.x) effectAA.x = node.x;
            if (node.x > effectBB.x) effectBB.x = node.x;
            if (node.y < effectAA.y) effectAA.y = node.y;
            if (node.y > effectBB.y) effectBB.y = node.y;
        }

        this.graphics.rect(effectAA.x, effectAA.y, effectBB.x - effectAA.x, effectBB.y - effectAA.y);
        this.graphics.stroke({ color: 0xff0000, width: 1 });
        game.app.render();
        const relevantNodes = new Array<Vector>();

        const relevantEdges = new Array<Edge<TerrainNode>>();

        for (const node of this.terrainMesh) {
            if (node.x >= effectAA.x && node.x <= effectBB.x && node.y >= effectAA.y && node.y <= effectBB.y) {
                relevantNodes.push(node);
                if (node.next) relevantEdges.push(new Edge(node, node.next));
            }
        }

        const skip = new Set<Edge>();
        for (const cedge of relevantEdges) {
            if (skip.has(cedge)) continue;
            for (const redge of relevantEdges) {
                if (skip.has(redge)) continue;
                if (cedge.doesIntersect(redge)) {
                    skip.add(cedge);
                    skip.add(redge);
                    const intersection = cedge.intersection(redge);
                    const node = new TerrainNode(intersection.x, intersection.y);
                    const old = cedge.start.next;

                    cedge.start.next = node;
                    redge.start.next = null;
                    node.next = redge.end;

                    old?.burn();

                    this.graphics.circle(intersection.x * 4, intersection.y * 4, 10);
                    this.graphics.fill({ color: 0x0099ff });
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

export type TerrainData = {
    pollution: number;
    fertility: number;
    erosion: number;
    moisture: number;
};
