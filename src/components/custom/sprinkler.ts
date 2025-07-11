import { Assets } from "pixi.js";
import { game } from "../../game";
import { Entity } from "../../hierarchy/entity";
import BasicSprite from "../generic/basicSprite";
import SprinklerCore from "./sprinklerCore";
import { filters } from "@pixi/sound";
import { clamp } from "../../utils/utils";
import { Component } from "../../hierarchy/component";
import { ComponentData } from "../componentIndex";


declare module "../types" { interface ComponentRegistry { Sprinkler: Sprinkler } }
export default class Sprinkler extends Component {
    static componentType = "Sprinkler";

    sprinklerCore?: SprinklerCore;
    tempSprinklerCore?: number;
    basicSprite!: BasicSprite;

    constructor(entity: Entity) {
        super(entity);
        this.onEntity("update", (dt) => this.update(dt));
    }

    override init() {
        super.init();
        if (this.tempSprinklerCore) {
            const entity = game.activeScene?.findEntity(this.tempSprinklerCore);
            if (entity) this.sprinklerCore = entity.getComponent(SprinklerCore);
        }
        this.basicSprite = this.entity.getComponent(BasicSprite)!;
    }

    override toData(): ComponentData {
        const data = {} as Parameters<this["applyData"]>[0];
        if (this.sprinklerCore) data.sprinklerCore = this.sprinklerCore.entity.id;
        return super.toData(data);
    }

    override applyData(data: { sprinklerCore?: number; }): void {
        if (data.sprinklerCore) this.tempSprinklerCore = data.sprinklerCore;
    }

    ticker = 0;
    update(dt: number) {
        if (this.sprinklerCore == undefined) return;
        if (!this.sprinklerCore.enabled || !this.sprinklerCore.powered) {
            this.basicSprite.sprite.texture = Assets.get("sprinkler");
            this.ticker = .5;
            return;
        }
        if (game.camera.inViewX(this.transform.position.x, 200)) {
            if (this.ticker < .5 && this.sprinklerCore.enabled) this.basicSprite.sprite.texture = Assets.get("sprinkler_active");
            else this.basicSprite.sprite.texture = Assets.get("sprinkler");
        }
        if (this.sprinklerCore.waterLevel <= 0.4) return;
        this.ticker += dt;
        if (this.ticker > 2) {
            this.spray();
        }
    }

    spray() {
        const sprinklerRate = 0.4
        this.sprinklerCore!.waterLevel -= sprinklerRate;
        this.ticker = 0;
        game.terrain.addMoisture(this.transform.position.x + game.terrain.dataWidth, sprinklerRate / 4);
        game.terrain.addMoisture(this.transform.position.x - game.terrain.dataWidth, sprinklerRate / 4);
        game.terrain.addMoisture(this.transform.position.x, sprinklerRate / 2);
        if (game.camera.inViewX(this.transform.position.x, 0)) game.soundManager.play("sprinkler", { volume: 0.04, filters: [new filters.StereoFilter(clamp((this.transform.position.x - game.player.position.x) * .2, -1, 1))] });
    }
}