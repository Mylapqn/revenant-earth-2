import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { BasicSprite } from "../generic/BasicSprite";

export class Tree extends Component {
    static componentType = "Tree";
    growth = 0;
    spriteComponent?: BasicSprite;
    nextseed = 3;
    asset: string = "./tree.png";

    constructor(parent: Entity) {
        super(parent);
        this.onEntity("update", (dt) => this.update(dt));
    }

    override init(): void {
        this.spriteComponent = this.entity.getComponent(BasicSprite);
        this.spriteComponent?.sprite.anchor.set(0.5, 1);
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
        if (!this.entity.components.has(this.id)) return;
        let tdata = game.terrain.getProperties(this.transform.position.x);
        if (tdata == undefined) return;
        if (tdata.fertility > 0) {
            this.growth += dt;
            tdata.fertility -= dt * 1;
        }
        if (this.nextseed < this.growth) {
            if (this.asset == "./bush.png")
                this.nextseed = this.growth + 1;
            if (this.asset == "./tree.png")
                this.nextseed = this.growth + 40;

            let newtree = Entity.fromData({
                kind: "Entity",
                component: [
                    {
                        componentType: "BasicSprite",
                        data: {
                            asset: this.asset,
                        },
                    },
                    {
                        componentType: "Interactable",
                    },
                    {
                        componentType: "Tree",
                        data: {
                            growth: 0,
                        },
                    },
                ],
            }, game.activeScene);

            if (this.asset == "./bush.png")
                newtree.transform.position.x = this.transform.position.x + (80 * Math.random() - 40) * 6;
            if (this.asset == "./tree.png")
                newtree.transform.position.x = this.transform.position.x + (80 * Math.random() - 40) * 5;
            newtree.transform.position.y = this.transform.position.y;
        }
        this.spriteComponent?.sprite.scale.set(Math.sqrt(this.growth) * .3);

    }


}