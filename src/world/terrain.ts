import { Graphics } from "pixi.js";
import { Edge, Vector, Vectorlike } from "../utils/vector";
import { game } from "../game";
import { Ellipse, Polygon, SATVector } from "detect-collisions";

import { ISerializable, ObjectKind, StateMode } from "../hierarchy/serialise";
import { ISceneObject, Scene } from "../hierarchy/scene";
import { TerrainMesh, TerrainNode } from "./terrainNode";
import { Input, MouseButton } from "../input";

export class Terrain implements ISerializable, ISceneObject {
    graphics: Graphics;
    terrainMesh: TerrainMesh;
    /** contains only loaded nodes */
    nodes: TerrainNode[];

    hitbox: Polygon;

    terrainData = new Array<TerrainData>();
    readonly dataWidth = 30;

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
        ], { userData: { terrain: true } });

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
            this.terrainData.push({ pollution: 0, fertility: 0, erosion: 0.9, moisture: 0.3 });
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
            if (node.x > game.player.position.x - 600 && node.x < game.player.position.x + 600) {
                this.nodes.push(node);
            }
        }
        if (this.nodes.length < 2) return;
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
            if (node.distance(game.worldMouse) < 30 && game.input.mouse.getButton(MouseButton.Left)) {
                const dir = node.diff(game.worldMouse);
                const length = dir.length() / 30;
                node.add(dir.normalize().mult((1 - length)*(1 - length)*10));
                editedNodes.add(node);
                editedNodes.add(prev);
                if (node.next) editedNodes.add(node.next);
            }
            prev = node;
        }

        this.draw();

        if (game.input.key("x")) {
            const data = this.getProperties(game.worldMouse.x);
            data.fertility = Math.min(1, data.fertility + 0.1);
            //data.moisture = Math.min(1, data.moisture + 0.1);
        }

        this.updateProperties();

        this.changeFixer(editedNodes);
        this.considerNodes();
    }

    private spread(a: TerrainData, b: TerrainData) {
        if (a.fertility > 0.8) {
            const half = (a.fertility - 0.01) * 0.001;
            b.fertility += half;
            a.fertility -= half;
        }

        if (a.moisture > 0.5) {
            const half = (a.moisture - 0.01) * 0.01;
            b.moisture += half;
            a.moisture -= half;
        }

        if (a.pollution > 0.5 && b.pollution < a.pollution) {
            const half = a.pollution * 0.005;
            b.pollution += half;
            a.pollution -= half;
        }
    }

    getProperties(x: number | Vectorlike) {
        if (typeof x === "object") x = x.x;
        let index = Math.round(x / this.dataWidth);
        if (index >= this.terrainData.length) index = this.terrainData.length - 1;
        if (index < 0) index = 0;
        const a = this.terrainData[index];
        return a;
    }

    erode(x: number | Vectorlike, value: number) {
        const a = this.getProperties(x);
        a.erosion += value;
        if (a.erosion > 1) a.erosion = 1;
    }

    fixErosion(x: number | Vectorlike, value: number) {
        const a = this.getProperties(x);
        a.erosion -= value;
        if (a.erosion < 0) a.erosion = 0;
    }

    addMoisture(x: number | Vectorlike, value: number) {
        const a = this.getProperties(x);
        a.moisture += value;
        if (a.moisture > 1) a.moisture = 1;
    }

    removeMoisture(x: number | Vectorlike, value: number) {
        const a = this.getProperties(x);
        a.moisture -= value;
        if (a.moisture < 0) a.moisture = 0;
    }

    addFertility(x: number | Vectorlike, grams: number, limit = 1) {
        const a = this.getProperties(x);
        a.fertility += grams / 1000;
        if (a.fertility > limit) {
            const remaining = a.fertility - limit;
            a.fertility = limit;
            return remaining;
        }
        return 0;
    }

    consumeFertility(x: number | Vectorlike, filterRate: number, limit = 0) {
        const a = this.getProperties(x);
        if (a.fertility < limit) return 0;
        const grams = a.fertility * filterRate;
        a.fertility -= grams / 1000;
        return grams;
    }

    generatePollution(x: number | Vectorlike, grams: number) {
        const a = this.getProperties(x);
        a.pollution += grams / 1000;
    }

    capturePollution(x: number | Vectorlike, filterRate: number, limit = 0) {
        const a = this.getProperties(x);
        if (a.pollution < limit) return 0;
        const grams = a.pollution * filterRate;
        a.pollution -= grams / 1000;
        return grams;
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

        for (const data of this.terrainData) {
            this.processChunk(data);
        }
    }

    processChunk(a: TerrainData) {
        const minWK = 0.1;
        const maxWK = 0.9;
        const waterkeep = (1 - a.erosion) * (maxWK - minWK) + minWK;
        let evaporated = 0;

        if (a.moisture > waterkeep) {
            // in water
            evaporated = 0.000001 * game.atmo.celsius;
        }
        // has water
        evaporated += a.moisture * 0.00000001 * game.atmo.celsius;

        if (a.moisture - evaporated < 0) {
            evaporated = a.moisture;
        }

        a.moisture -= evaporated;
        game.atmo.waterLevel += evaporated;
        // energy to evaporate
        const energy = evaporated * 10000;
        game.atmo.energy(-energy, "evaporation");
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
            this.graphics.lineTo(node.x, node.y + data.moisture * 20);

            let r = Math.floor(Math.max(0, Math.min(1, (1 - data.fertility) * 2)) * 255)
                .toString(16)
                .padStart(2, "0");
            let g = Math.floor(Math.max(0, Math.min(1, data.fertility * 2)) * 255)
                .toString(16)
                .padStart(2, "0");
            let b = Math.floor(Math.max(0, Math.min(1, data.moisture * 2)) * 255)
                .toString(16)
                .padStart(2, "0");
            b = "00";

            this.graphics.stroke({ color: `0x${r}${g}${b}`, alpha: 1, width: 1 });
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

        if (game.input.keyDown("p")) {
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
