import { DecompPolygon, Ellipse, Polygon, SATVector } from "detect-collisions";
import { Graphics } from "pixi.js";
import { game } from "../game";
import { ISceneObject, Scene } from "../hierarchy/scene";
import { ISerializable, KindedObject, StateMode } from "../hierarchy/serialise";
import { TerrainMesh, TerrainNode } from "../terrainNode";
import { Vectorlike, Vector, Edge } from "../vector";
import { decomp, makeCCW } from "poly-decomp-es";
import shape from "./hitbox.json";

export class Interior implements ISerializable, ISceneObject {
    graphics: Graphics;

    nodes: Vector[];

    hitboxes: Polygon[];

    constructor() {
        game.activeScene.register(this);
        this.graphics = new Graphics();
        this.nodes = [];

        game.terrainContainer.addChild(this.graphics);
        this.hitboxes = [];

        this.defaultTerrain();
        this.generateHitbox();
    }

    unload() {
        game.activeScene.unregister(this);
    }

    static deserialise(raw: any, scene?: Scene) {
        /*const data = raw as { kind: string; terrainMesh: Array<Vectorlike>; terrainData: Array<TerrainData> };
        game.terrain.terrainMesh = new TerrainMesh();
        for (const node of data.terrainMesh) {
            game.terrain.terrainMesh.push(new TerrainNode(node.x, node.y));
        }

        game.terrain.terrainData = data.terrainData;

        game.terrain.considerNodes();
        if (scene) scene.register(game.terrain);*/
    }

    defaultTerrain() {
        this.nodes.push(new Vector(-100, 200));
        this.nodes.push(new Vector(-101, -20));
        this.nodes.push(new Vector(0, -80));
        this.nodes.push(new Vector(100, -20));
        this.nodes.push(new Vector(101, 201));
    }

    generateHitbox() {
        let leftmostNode = this.nodes[0];
        let rightmostNode = this.nodes[0];
        let topmostNode = this.nodes[0];
        let bottommostNode = this.nodes[0];
        for (const node of this.nodes) {
            if (node.x < leftmostNode.x) leftmostNode = node;
            if (node.x > rightmostNode.x) rightmostNode = node;
            if (node.y < topmostNode.y) topmostNode = node;
            if (node.y > bottommostNode.y) bottommostNode = node;
        }
        let leftMostIndex = this.nodes.indexOf(leftmostNode);
        let rightMostIndex = this.nodes.indexOf(rightmostNode);

        let aaa = this.nodes.slice(0, leftMostIndex);
        let bbb = this.nodes.slice(leftMostIndex - 1, undefined);
        this.nodes = bbb.concat(aaa);
        const padding = 10;
        let polygonNodes = this.nodes.concat([
            new Vector(leftmostNode.x - padding, bottommostNode.y + padding),
            new Vector(rightmostNode.x + padding, bottommostNode.y + padding),
            new Vector(rightmostNode.x + padding, topmostNode.y - padding),
            new Vector(leftmostNode.x - padding, topmostNode.y - padding),
            new Vector(leftmostNode.x - padding, bottommostNode.y + padding),
        ]);

        let arrayedVerts = polygonNodes.map(node => node.xy());
        arrayedVerts = shape.map(node => [node.x / 2, node.y / 2]);
        makeCCW(arrayedVerts);
        const convexPolygons = decomp(arrayedVerts);
        if (!convexPolygons) throw new Error("No convex polygons");

        for (const convexPolygon of convexPolygons) {
            this.hitboxes.push(game.collisionSystem.createPolygon({ x: 0, y: 0 }, convexPolygon.map(node => new SATVector(node[0], node[1]))));

        }

        /*polygonNodes = [
            new Vector(-30,-100),
            new Vector(30,-100),
            new Vector(30,-120),
            new Vector(-40,-120),
            new Vector(-40,40),
            new Vector(40,40),
            new Vector(40,20),
            new Vector(30,20),
            new Vector(30,30),
            new Vector(-30,30),
            new Vector(-30,-80)
        ]*/

        /*this.hitbox.setPoints(polygonNodes.map((node) => new SATVector(node.x, node.y)));
        //this.hitbox.setPoints(this.nodes.map((node) => new SATVector(node.x, node.y)));
        this.hitbox.updateBody(true);*/
    }

    serialise(mode: StateMode): false | KindedObject {
        let nodes = [];
        for (const node of this.nodes) {
            nodes.push({ x: Math.round(node.x), y: Math.round(node.y) });
        }

        return { kind: "Terrain", interiorNodes: nodes };
    }

    update() {
        this.graphics.clear();
        this.draw();
    }

    draw() {

        for (const hitbox of this.hitboxes) {
            this.graphics.moveTo(hitbox.points[0].x, hitbox.points[0].y);
            for (const node of hitbox.points) {
                this.graphics.lineTo(node.x, node.y);
            }

            this.graphics.fill(0x141418, 1);
            this.graphics.stroke({ color: 0x888888, alpha: 1, width: 1 });
        }


        /*for (let index = -20; index < 20; index++) {
            const x = (Math.round(game.player.position.x / this.dataWidth) + index) * this.dataWidth
            const data = this.getProperties(x);
            this.graphics.rect(x, game.player.position.y - 500, this.dataWidth, 1000);
            this.graphics.fill({ color: 0x00ff00, alpha: data.fertility });
        }*/
    }
}