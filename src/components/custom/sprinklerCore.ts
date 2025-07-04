import { game } from "../../game";
import { Component, ComponentData } from "../../hierarchy/component";
import { Entity } from "../../hierarchy/entity";
import { ParticleText } from "../../hierarchy/particleText";
import EntityTooltip from "../generic/entityTooltip";
import Interactable from "../generic/interactable";
import Power from "../generic/power";

declare module "../types" { interface ComponentRegistry { SprinklerCore: SprinklerCore } }
export default class SprinklerCore extends Component {
    static componentType = "SprinklerCore";
    constructor(entity: Entity) {
        super(entity);
        this.onEntity("interact", () => this.toggle());
        this.onEntity("update", (dt) => this.update(dt));
    }


    enabled = false;
    powered = false;
    waterLevel = 50;
    warningTimer = 0;

    override toData(): ComponentData {
        const data = { active: this.enabled, waterLevel: this.waterLevel } as Parameters<this["applyData"]>[0];
        return super.toData(data);
    }

    override applyData(data?: { active?: boolean, waterLevel?: number }): void {
        if (data && data.active) this.enabled = data.active;
        if (data && data.waterLevel) this.waterLevel = data.waterLevel;
    }

    power?: Power;
    tooltip?: EntityTooltip;

    override init() {
        super.init();
        this.entity.getComponent(Interactable)?.setText("Activate");
        this.tooltip = this.entity.getComponent(EntityTooltip);
        if (this.tooltip) this.tooltip.tooltipName = "Sprinkler";
        this.power = this.entity.getComponent(Power);
    }

    update(dt: number): void {
        if (game.weather.weatherData.rainIntensity > 0) {
            this.waterLevel += dt * game.weather.weatherData.rainIntensity * 2;
            this.waterLevel = Math.min(this.waterLevel, 50);
        }

        if (this.enabled && this.power) {
            this.powered = this.power.consume(0.25 * dt);
            if (!this.powered) {
                /*this.active = false;
                this.setInteractPrompt();*/
                this.warningTimer += dt;
            }
        }
        if (this.warningTimer > 3) {
            this.warningTimer = 0;
            if (game.camera.inViewX(this.transform.position.x, 100))
                new ParticleText("No power!", this.transform.position.clone(), 3);
        }

        this.tooltip?.tooltipData.set("water", `${this.waterLevel.toFixed(1)}/50.0hl`);

    }

    toggle() {
        this.enabled = !this.enabled;
        this.setInteractPrompt();
    }
    setInteractPrompt() {
        this.entity.getComponent(Interactable)?.setText(this.enabled ? "Deactivate" : "Activate");
    }
}