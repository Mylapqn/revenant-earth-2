import { DefaultShader, FillGradient, Geometry, GlProgram, Graphics, Mesh, MeshGeometry, Shader } from "pixi.js";
import { Edge, Vector, Vectorlike } from "../utils/vector";
import { Game, game } from "../game";
import { Ellipse, Polygon, SATVector } from "detect-collisions";

import { ISerializable, ObjectKind, StateMode } from "../hierarchy/serialise";
import { ISceneObject, Scene } from "../hierarchy/scene";
import { TerrainMesh, TerrainNode } from "./terrainNode";
import { Input, MouseButton } from "../input";

import vertex from "../shaders/terrainSurface.vert?raw";
import fragment from "../shaders/terrainSurface.frag?raw";
import { placeholderGeometry, lerp } from "../utils/utils";
import { HitboxGeometry } from "../shaders/hitboxGeometry";
import { Debug } from "../dev/debug";

export enum TerrainInspectMode {
    none = 0,
    fertility = 1,
    moisture = 2,
    pollution = 3,
    erosion = 4
}

export class Terrain implements ISerializable, ISceneObject {
    graphics: Graphics;
    terrainMesh: TerrainMesh;
    surfaceMesh;
    /** contains only loaded nodes */
    nodes: TerrainNode[];
    initialIndex = 0;

    hitbox: Polygon;

    terrainData = new Array<TerrainData>();
    readonly dataWidth = 30;

    totalWidth = 2000;

    inspectMode: TerrainInspectMode = 0;

    static inspectModes = ["none", "fertility", "moisture", "pollution", "erosion"];

    constructor() {
        game.activeScene.register(this);
        this.graphics = new Graphics();
        this.terrainMesh = new TerrainMesh();
        this.surfaceMesh = new Mesh({
            geometry: placeholderGeometry, shader: new Shader({
                glProgram: GlProgram.from({ vertex, fragment }),
                resources: {
                    group: {
                        uInspectMode: {
                            type: "i32",
                            value: 0
                        }
                    }
                }
            })
        });
        this.nodes = [];

        game.terrainContainer.addChild(this.graphics);
        game.terrainContainer.addChild(this.surfaceMesh);
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
        if (scene) {
            scene.register(game.terrain);
            scene.hasTerrain = true;
        }
    }

    defaultTerrain() {
        let lastHeight = 0;
        for (let index = 0; index < 1000; index++) {
            lastHeight += Math.random() * 5 - 2.5;
            this.terrainMesh.push(new TerrainNode(20 * index, lastHeight));
        }

        let index = 0;
        for (const element of this.terrainMesh) {
            index++;
            if (index > 25 && index < 50) element.add({ x: 0, y: -100 });
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
        let index = 0;
        this.initialIndex = -1;
        for (const node of this.terrainMesh) {
            if (node.x > game.player.position.x - 600 && node.x < game.player.position.x + 600) {
                if (this.initialIndex === -1) this.initialIndex = index;
                this.nodes.push(node);
            }
            index++;
        }
        if (this.nodes.length < 2) return;
        this.nodes.unshift(new TerrainNode(this.nodes[0].x, 1000));
        this.nodes.push(new TerrainNode(this.nodes[this.nodes.length - 1].x, 1000));
        this.hitbox.setPoints(this.nodes.map((node) => new SATVector(node.x, node.y)));
        this.hitbox.updateBody(true);
    }

    update() {
        this.graphics.clear();
        if (!game.activeScene.hasTerrain) return;

        const editedNodes = new Set<TerrainNode>();
        let prev = this.nodes[0];
        for (const node of this.nodes) {
            if (node.distance(game.worldMouse) < 30 && game.input.mouse.getButton(MouseButton.Left) && !Debug.movingEntity && game.inputEnabled) {
                const dir = node.diff(game.worldMouse);
                const length = dir.length() / 30;
                node.add(dir.normalize().mult((1 - length) * (1 - length) * 10));
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

    getProperties(x: number | Vectorlike): TerrainData {
        if (typeof x === "object") x = x.x;
        let index = Math.round(x / this.dataWidth);
        if (index >= this.terrainData.length) index = this.terrainData.length - 1;
        if (index < 0) index = 0;
        let a = this.terrainData[index];
        if(a === undefined) a = { pollution: 0, fertility: 0, erosion: 0, moisture: 0 };
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
        const waterkeep = lerp(minWK, maxWK, 1. - a.erosion);
        let evaporated = 0;

        if (game.weather.weatherData.rainIntensity <= 0) {
            if (a.moisture > waterkeep) {
                // in water
                evaporated = 0.00001 * game.atmo.celsius;
            }
            // has water
            evaporated += a.moisture * 0.00000001 * game.atmo.celsius;

            if (a.moisture - evaporated < 0) {
                evaporated = a.moisture;
            }
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

        this.graphics.fill(0x151008);

        const terrainStats: number[] = [];
        const terrainInspect: number[] = [];
        const depth = 30;
        const uvWidth = 20 / depth;

        for (let i = 1; i < this.hitbox.points.length - 1; i++) {
            const node = this.hitbox.points[i];
            //const x = Math.round(node.x / this.dataWidth) * this.dataWidth;
            const data = this.getProperties(node.x);

            terrainStats.push(data.moisture, data.fertility, data.erosion);
            terrainStats.push(data.moisture, data.fertility, data.erosion);

            let inspect = 0;
            if (this.inspectMode != 0) inspect = this.getProperties(node.x)[Terrain.inspectModes[this.inspectMode] as keyof TerrainData];
            if (this.inspectMode == TerrainInspectMode.pollution || this.inspectMode == TerrainInspectMode.erosion) inspect = 1 - inspect;

            terrainInspect.push(inspect);
            terrainInspect.push(inspect);
        }

        const hitboxGeometry = new HitboxGeometry({
            points: this.hitbox.points,
            uvOffset: this.initialIndex,
            depth: depth,
            perspectiveDepth: 0.1,
            customAttributes: {
                aTerrainStats: terrainStats, aTerrainInspect: terrainInspect
            },
        });

        this.surfaceMesh.geometry = hitboxGeometry;
        this.surfaceMesh.shader!.resources.group.uniforms.uInspectMode = this.inspectMode != 0 ? 1 : 0;
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

        if (game.debugView) {
            this.graphics.rect(effectAA.x, effectAA.y, effectBB.x - effectAA.x, effectBB.y - effectAA.y);
            this.graphics.stroke({ color: 0xff0000, width: 1 });
        }
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
