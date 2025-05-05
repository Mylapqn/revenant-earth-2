import { Assets, GlProgram, Graphics, Mesh, Shader, Sprite, Texture, TilingSprite } from "pixi.js";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { game } from "../../game";
import { SpriteDirection } from "./spriteDirection";
import { Polygon, SATVector } from "detect-collisions";
import { Vector, Vectorlike } from "../../utils/vector";
import { decomp, makeCCW, quickDecomp } from "poly-decomp-es";
import { placeholderGeometry } from "../../utils/utils";

import vertex from "../../shaders/vert.vert?raw";
import fragment from "../../shaders/frag.frag?raw";
import { HitboxGeometry } from "../../shaders/hitboxGeometry";
import { UIElement } from "../../ui/ui";
import { UIButton } from "../../ui/uiButton";
import { Debug } from "../../dev/debug";



export class Hitbox extends Component {
    static componentType = "Hitbox";
    polygons!: Polygon[];
    nodes: Vectorlike[] = [];
    originalNodes: Vectorlike[] = [];
    graphics: Graphics;
    isInterior = false;
    directionComponent?: SpriteDirection;
    refreshRender = true;
    hitboxMesh;
    edgeTexture!: Texture;
    bgTexture!: Texture;
    bgSprite: TilingSprite;
    hitboxName?: string;

    constructor(entity: Entity) {
        super(entity);
        this.graphics = new Graphics();
        this.onEntity("draw", (dt) => this.draw(dt));
        this.onEntity("update", (dt) => this.update(dt));
        this.polygons = [];
        this.edgeTexture = Texture.WHITE;
        this.bgTexture = Texture.WHITE;
        this.bgSprite = new TilingSprite({ texture: this.bgTexture, width: 10000, height: 10000 });
        this.bgSprite.position.set(-1000, -1000);
        this.hitboxMesh = new Mesh({
            geometry: placeholderGeometry, shader: new Shader({
                glProgram: new GlProgram({ vertex, fragment }),
                resources: {
                    uSampler: Texture.WHITE.source,
                }
            })
        });
        Assets.load("floor.png").then((texture) => {
            this.edgeTexture = texture;
            this.edgeTexture.source.scaleMode = "nearest";
            this.edgeTexture.source.wrapMode = "repeat";
            this.hitboxMesh.shader!.resources.uSampler = this.edgeTexture.source
        });
        Assets.load("interior_bg.png").then((texture) => {
            this.bgTexture = texture;
            this.bgSprite.texture = this.bgTexture;
        });
    }

    override toData(): ComponentData {
        const data: any = { interior: this.isInterior };
        if (this.hitboxName) data.hitboxName = this.hitboxName;
        else data.nodes = this.nodes;
        return super.toData(data);
    }

    override applyData(data: { nodes?: Vectorlike[], interior?: boolean, hitboxName?: string }): void {
        this.isInterior = data.interior ?? false;
        const nodes = data.hitboxName ? game.hitboxLibrary.get(data.hitboxName) : data.nodes;
        if (!nodes) throw new Error(`Hitbox not loaded`);
        this.hitboxName = data.hitboxName;

        game.bgContainer.addChild(this.bgSprite);
        game.pixelLayer.container.addChild(this.graphics);
        game.pixelLayer.container.addChild(this.hitboxMesh);

        this.applyNodes(nodes);
    }

    override remove() {
        this.graphics.destroy();
        this.hitboxMesh.destroy();
        this.bgSprite.destroy();
        for (const polygon of this.polygons) {
            game.collisionSystem.remove(polygon);
        }
        super.remove();
    }

    override init(): void {
        this.directionComponent = this.entity.getComponent(SpriteDirection);
    }
    debugOptions(): UIElement[] {
        const buttons = [];
        buttons.push(new UIButton(`Edit hitbox`, () => { Debug.hitboxEditor.startEditing(this) }));
        return super.debugOptions(buttons, this.hitboxName ? `(${this.hitboxName})` : "(custom)");
    }

    applyNodes(originalNodes: Vectorlike[]) {
        this.originalNodes = originalNodes;
        this.nodes = originalNodes;

        for (const polygon of this.polygons) {
            game.collisionSystem.remove(polygon);
        }
        this.polygons = [];

        if (this.isInterior)
            this.nodes = this.interiorHitbox();

        let arrayedVerts = this.nodes.map(node => [node.x, node.y] as [number, number]);
        makeCCW(arrayedVerts);
        const convexPolygons = quickDecomp(arrayedVerts);
        if (!convexPolygons) throw new Error("No convex polygons");

        for (const convexPolygon of convexPolygons) {
            this.polygons.push(game.collisionSystem.createPolygon({ x: 0, y: 0 }, convexPolygon.map(node => new SATVector(node[0], node[1]))));
        }
    }

    draw(dt: number) {
        if (!this.refreshRender) //return;
            this.refreshRender = false;
        //if (this.directionComponent != undefined) this.sprite.scale.x = this.directionComponent.direction;
        //this.sprite.position.set(this.transform.position.x, this.transform.position.y);
        this.graphics.clear();

        for (const hitbox of this.polygons) {
            this.graphics.moveTo(hitbox.points[0].x + this.transform.position.x, hitbox.points[0].y + this.transform.position.y);
            for (let i = 0; i < hitbox.points.length; i++) {
                this.graphics.lineTo(hitbox.points[i].x + this.transform.position.x, hitbox.points[i].y + this.transform.position.y);
            }
            this.graphics.lineTo(hitbox.points[0].x + this.transform.position.x, hitbox.points[0].y + this.transform.position.y);
            this.graphics.fill(0x000000, 1);
            //this.graphics.stroke({ color: 0xff0000, width: 1, alpha: .1 });
        }

        /*         this.graphics.moveTo(this.nodes[0].x + this.transform.position.x, this.nodes[0].y + this.transform.position.y);
                for (let i = 0; i < this.nodes.length - (this.isInterior ? 6 : 0); i++) {
                    this.graphics.lineTo(this.nodes[i].x + this.transform.position.x, this.nodes[i].y + this.transform.position.y);
                }
                this.graphics.lineTo(this.nodes[0].x + this.transform.position.x, this.nodes[0].y + this.transform.position.y);
                this.graphics.stroke({ color: 0x00ff00, width: 1 }); */
        const points = this.nodes.map(node => new SATVector(node.x + this.transform.position.x, node.y + this.transform.position.y));
        if (this.isInterior) {
            //remove last 3 
            points.splice(points.length - 5, 5);
            points.push(points[1]);
            points.push(points[2]);
            this.bgSprite.position.set(-1000 + this.transform.position.x, -1000 + this.transform.position.y);
        }
        const hbGeo = new HitboxGeometry({
            points: points,
            depth: this.edgeTexture.height,
            perspectiveDepth: 0,
            UVWidth: this.edgeTexture.width
        });
        this.hitboxMesh.geometry = hbGeo;


    }

    interiorHitbox() {
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
        let bbb = this.nodes.slice(leftMostIndex, undefined);
        this.nodes = bbb.concat(aaa);
        const padding = 1000;
        return this.nodes.concat([
            new Vector(leftmostNode.x - padding, bottommostNode.y + padding),
            new Vector(rightmostNode.x + padding, bottommostNode.y + padding),
            new Vector(rightmostNode.x + padding, topmostNode.y - padding),
            new Vector(leftmostNode.x - padding, topmostNode.y - padding),
            new Vector(leftmostNode.x - padding - .01, bottommostNode.y + padding),
            this.nodes[0],
        ].reverse());
    }

    update(dt: number) {
        for (const polygon of this.polygons) {
            polygon.setPosition(this.transform.position.x, this.transform.position.y);
            polygon.updateBody();
        }
    }

}