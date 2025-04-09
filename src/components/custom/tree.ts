import { Assets, Color, Texture } from "pixi.js";
import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { BasicSprite } from "../generic/BasicSprite";
import { ParticleText } from "../../hierarchy/particleText";
import { Vector } from "../../vector";
import { Prefab } from "../../prefabs";
import { FoliageMesh } from "../../shaders/foliageMesh";

export class Tree extends Component {
    static componentType = "Tree";
    growth = 0;
    health = 1;
    spriteComponent?: BasicSprite;
    nextseed = 3;
    asset: string = "./tree.png";
    shadedMesh ?: FoliageMesh;

    constructor(parent: Entity) {
        super(parent);
        this.onEntity("update", (dt) => this.update(dt));
    }

    override init(): void {
        this.spriteComponent = this.entity.getComponent(BasicSprite);
        this.spriteComponent?.sprite.anchor.set(0.5, 1);
        Assets.load("./tree.png").then((texture: Texture) => {
            console.log(texture);
            this.shadedMesh = new FoliageMesh(texture);
            game.pixelLayer.addChild(this.shadedMesh);
            //sm.scale.set(10);
            this.shadedMesh.position.set(this.transform.position.x, this.transform.position.y);
            this.shadedMesh.pivot.set(0.5, 1);
        });
    }

    override toData(): ComponentData {
        const data = { growth: this.growth, asset: this.asset };
        return super.toData(data);
    }

    override applyData(data: { growth: number; asset?: string }): void {
        this.growth = data.growth;
        if (data.asset) this.asset = data.asset;
    }

    update(dt: number) {
        if (!this.entity.components.has(this.id) || this.spriteComponent == undefined) return;
        let tdata = game.terrain.getProperties(this.transform.position.x);
        if (tdata == undefined) return;
        if (tdata.pollution > 0) {
            this.health = Math.max(0, this.health - dt * tdata.pollution);
            if (this.health > .1) {
                tdata.pollution = Math.max(0, tdata.pollution - dt * .1);
            }
            this.spriteComponent.sprite.tint = new Color({ r: 255, g: this.health * 255, b: this.health * 255, a: 1 });
        }
        if (this.health < 1) {
            this.health = Math.min(1, this.health + dt * .1);
        }
        if (tdata.fertility > 0) {
            this.growth += dt * this.health * tdata.fertility*2;
            tdata.fertility -= dt * this.health*.1;
        }
        if (this.nextseed < this.growth) {
            if (this.asset == "./bush.png")
                this.nextseed = this.growth + 1;
            if (this.asset == "./tree.png")
                this.nextseed = this.growth + 40;

            let newtree = Prefab.Tree({asset: this.asset, scene: this.entity.scene});
            new ParticleText("seed", this.transform.position.result().add(new Vector(0, -40)));

            if (this.asset == "./bush.png")
                newtree.transform.position.x = this.transform.position.x + (80 * Math.random() - 40) * 6;
            if (this.asset == "./tree.png")
                newtree.transform.position.x = this.transform.position.x + (80 * Math.random() - 40) * 5;
            newtree.transform.position.y = this.transform.position.y;
        }
        this.spriteComponent?.sprite.scale.set(Math.sqrt(this.growth) * .3);

    }


}