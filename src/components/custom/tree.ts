import { Assets, Color, Graphics, Texture } from "pixi.js";
import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { BasicSprite } from "../generic/BasicSprite";
import { ParticleText } from "../../hierarchy/particleText";
import { Vector } from "../../vector";
import { Prefab } from "../../hierarchy/prefabs";
import { FoliageMesh } from "../../shaders/foliageMesh";
import { TooltipComponent } from "../generic/tooltipComponent";
import { ShaderMeshComponent } from "../generic/ShaderMeshComponent";

export class Tree extends Component {
    static componentType = "Tree";
    growth = 0;
    health = 1;
    shaderMeshComponent!: ShaderMeshComponent;
    tooltipComponent?: TooltipComponent
    nextseed = 3;
    asset: string = "./tree.png";
    graphics: Graphics;
    nextDraw = 2;
    timeSinceDraw = 2;

    constructor(parent: Entity) {
        super(parent);
        this.onEntity("update", (dt) => this.update(dt));
        this.graphics = new Graphics();
    }

    override init(): void {
        this.tooltipComponent = this.entity.getComponent(TooltipComponent);
        if (this.tooltipComponent) this.tooltipComponent.tooltipName = "Tree";
        this.shaderMeshComponent = this.entity.getComponent(ShaderMeshComponent)!;
        this.shaderMeshComponent?.container.addChild(this.graphics);
        this.drawTree();
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
        this.timeSinceDraw += dt;
        if (this.timeSinceDraw > this.nextDraw) {
            this.timeSinceDraw = 0;
            this.drawTree();
        }
        if (!this.entity.components.has(this.id) || this.shaderMeshComponent == undefined) return;
        let tdata = game.terrain.getProperties(this.transform.position.x);
        if (this.tooltipComponent) {
            this.tooltipComponent.tooltipData.set("treeHealth", parseFloat(this.health.toFixed(2)).toString());
            this.tooltipComponent.tooltipData.set("treeGrowth", parseFloat(this.growth.toFixed(2)).toString());
            //pollution fertility
            this.tooltipComponent.tooltipData.set("pollution", parseFloat(tdata.pollution.toFixed(2)).toString());
            this.tooltipComponent.tooltipData.set("fertility", parseFloat(tdata.fertility.toFixed(2)).toString());
        }
        if (tdata == undefined) return;
        if (tdata.pollution > 0) {
            this.health = Math.max(0, this.health - dt * tdata.pollution);
            if (this.health > .1) {
                tdata.pollution = Math.max(0, tdata.pollution - dt * .1);
            }
            this.shaderMeshComponent.renderMesh.tint = new Color({ r: 255, g: this.health * 255, b: this.health * 255, a: 1 });
        }
        if (this.health < 1) {
            this.health = Math.min(1, this.health + dt * .1);
        }
        if (tdata.fertility > 0) {
            this.growth += dt * this.health * tdata.fertility * 2;
            tdata.fertility -= dt * this.health * .1;
        }
        if (this.nextseed < this.growth) {
            if (this.asset == "./bush.png")
                this.nextseed = this.growth + 1;
            if (this.asset == "./tree.png")
                this.nextseed = this.growth + 40;
            this.nextseed = this.growth + .1;
            let newtree = Prefab.Tree({ asset: this.asset, scene: this.entity.scene });
            new ParticleText("seed", this.transform.position.result().add(new Vector(0, -40)));

            if (this.asset == "./bush.png")
                newtree.transform.position.x = this.transform.position.x + (80 * Math.random() - 40) * 6;
            if (this.asset == "./tree.png")
                newtree.transform.position.x = this.transform.position.x + (80 * Math.random() - 40) * 5;
            newtree.transform.position.y = this.transform.position.y;
        }
        //this.shaderMeshComponent.renderMesh.scale.set(Math.sqrt(this.growth) * .3);
    }

    drawTree() {
        this.graphics.clear();
        this.graphics.moveTo(0, 0);
        this.graphics.lineTo(0, -this.growth * 20);
        this.graphics.stroke({ color: 0x773300, width: this.growth });
        let y = -this.growth * 15;
        for (let i = 1; i <= this.growth; i++) {
            let radius = (this.growth - i+1) * 5
            this.graphics.circle(0, y, radius);
            y -= radius
        }
        this.graphics.stroke({ color: 0x449900, width: 2 });
        this.graphics.fill(0x338800);
        this.shaderMeshComponent.draw();
    }


}