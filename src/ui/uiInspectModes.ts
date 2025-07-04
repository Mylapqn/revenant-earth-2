import { game } from "../game";
import { TerrainInspectMode } from "../world/terrain";
import { UIElement } from "./uiElement";
import { TooltipID } from "./uiTooltipData";

export class UIInspectModes {
    container: UIElement;
    prompts: Map<TerrainInspectMode, UIElement> = new Map<TerrainInspectMode, UIElement>();
    selected: UIElement;
    constructor(parent: HTMLElement) {
        this.container = new UIElement({ type: "div", classes: ["inspectModesContainer"], parent: parent, blockMouse: true });
        /*this.addPrompt(["A","D"],"Move");
        this.addPrompt(["Space"],"Jump");*/
        this.addInspectMode("None", "cross.svg", TerrainInspectMode.none, TooltipID.inspectNone);
        this.addInspectMode("Fertility", "fertility.svg", TerrainInspectMode.fertility, TooltipID.soilFertility);
        this.addInspectMode("Moisture", "moisture.svg", TerrainInspectMode.moisture, TooltipID.soilMoisture);
        this.addInspectMode("Erosion", "erosion.svg", TerrainInspectMode.erosion, TooltipID.soilErosion);
        this.addInspectMode("Toxicity", "pollution.svg", TerrainInspectMode.pollution, TooltipID.soilToxicity);
        this.selected = this.prompts.get(TerrainInspectMode.none)!;
        this.select(TerrainInspectMode.none);
    }
    addInspectMode(name: string, icon: string, inspectMode: TerrainInspectMode, tooltip: TooltipID) {
        const wrapper = new UIElement({
            type: "div",
            classes: ["inspectModeButton"],
            parent: this.container.htmlElement,
            onclick: () => this.select(inspectMode),
            mouseSoundEffects: true,
            tooltip: tooltip
        });
        const textElement = new UIElement({ type: "div", classes: ["text"], parent: wrapper.htmlElement });
        textElement.htmlElement.innerText = name;
        const iconElement = new UIElement<HTMLImageElement>({ type: "img", classes: ["icon"], parent: wrapper.htmlElement });
        const iconSrc = "./gfx/ui/icons/" + icon;
        iconElement.htmlElement.src = iconSrc;
        this.prompts.set(inspectMode, wrapper);
        return wrapper;
    }
    select(inspectMode: TerrainInspectMode) {
        if (game.terrain)
            game.terrain.inspectMode = inspectMode;
        if (this.selected) this.selected.htmlElement.classList.remove("selected");
        this.selected = this.prompts.get(inspectMode)!;
        if (inspectMode != TerrainInspectMode.none)
            this.selected.htmlElement.classList.add("selected");
    }
    remove() {
        this.container.remove();
    }
}