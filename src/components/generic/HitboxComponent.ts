import { Assets, Graphics, Sprite, Texture } from "pixi.js";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { game } from "../../game";
import { SpriteDirectionComponent } from "./spriteDirectionComponent";
import { Polygon, SATVector } from "detect-collisions";
import { Vectorlike } from "../../vector";
import { decomp, makeCCW, quickDecomp } from "poly-decomp-es";



export class HitboxComponent extends Component {
    static componentType = "HitboxComponent";
    polygons!: Polygon[];
    nodes: Vectorlike[] = [];
    graphics: Graphics;
    directionComponent?: SpriteDirectionComponent;

    constructor(entity: Entity) {
        super(entity);
        this.graphics = new Graphics();
        this.onEntity("draw", (dt) => this.draw(dt));
        this.onEntity("update", (dt) => this.update(dt));
        this.polygons = [];
    }

    override toData(): ComponentData {
        const data = { nodes: this.nodes as Vectorlike[] };
        return super.toData(data);
    }

    override applyData(data: { nodes: Vectorlike[] }): void {
        //this.nodes = data.nodes.map(node => ({x:node.x*3, y:node.y*3}));
        this.nodes = data.nodes;

        game.pixelLayer.container.addChild(this.graphics);

        let arrayedVerts = this.nodes.map(node => [node.x, node.y] as [number, number]);
        makeCCW(arrayedVerts);
        const convexPolygons = quickDecomp(arrayedVerts);
        if (!convexPolygons) throw new Error("No convex polygons");

        for (const convexPolygon of convexPolygons) {
            this.polygons.push(game.collisionSystem.createPolygon({ x: 0, y: 0 }, convexPolygon.map(node => new SATVector(node[0], node[1]))));
        }
    }

    override remove() {
        for (const polygon of this.polygons) {
            game.collisionSystem.remove(polygon);
        }
        super.remove();
    }

    override init(): void {
        this.directionComponent = this.entity.getComponent(SpriteDirectionComponent);
    }

    draw(dt: number) {
        //if (this.directionComponent != undefined) this.sprite.scale.x = this.directionComponent.direction;
        //this.sprite.position.set(this.transform.position.x, this.transform.position.y);
        this.graphics.clear();
        this.graphics.moveTo(this.nodes[0].x + this.transform.position.x, this.nodes[0].y + this.transform.position.y);
        for (const node of this.nodes) {
            this.graphics.lineTo(node.x + this.transform.position.x, node.y + this.transform.position.y);
        }
        this.graphics.lineTo(this.nodes[0].x + this.transform.position.x, this.nodes[0].y + this.transform.position.y);
        this.graphics.stroke({ color: 0x00ff00, width: 1 });
    }

    update(dt: number) {
        for (const polygon of this.polygons) {
            polygon.setPosition(this.transform.position.x, this.transform.position.y);
            polygon.updateBody();
        }
    }

}