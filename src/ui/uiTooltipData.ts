export enum TooltipID {
    soilErosion,
    soilMoisture,
    soilFertility,
    soilToxicity,
    airPollution,
    airTemperature,
    plants,
    airCo2,
    inspectNone,
}
export class UITooltipData {
    static data: Record<TooltipID, string> = {
        [TooltipID.soilErosion]: `Eroded soil is cracked and unstable. It cannot hold <b tooltip="${TooltipID.soilMoisture}">moisture</b> and it dries out quickly. Grow <b tooltip="${TooltipID.plants}">plants</b> to remove erosion.`,
        [TooltipID.soilMoisture]: `Moisture means how much water the soil contains. <b tooltip="${TooltipID.plants}">Plants</b> need it to grow and survive. <b tooltip="${TooltipID.soilErosion}">Eroded</b> soil dries out quickly.`,
        [TooltipID.soilFertility]: `Fertility means how much nutrients the soil contains. Like <b tooltip="${TooltipID.soilMoisture}">moisture</b>, It is necessary for the growth of <b tooltip="${TooltipID.plants}">plants</b>, however it is not as important for their survival.`,
        [TooltipID.soilToxicity]: `Toxic soil sucks.`,
        [TooltipID.airPollution]: `Polluted air sucks.`,
        [TooltipID.airTemperature]: `Hot air means unstable weather and high <b tooltip="${TooltipID.soilErosion}">erosion</b>.`,
        [TooltipID.airCo2]: `Co2 means <b tooltip="${TooltipID.airTemperature}">hot air</b>.`,
        [TooltipID.plants]: `Plant a seed in <b tooltip="${TooltipID.soilMoisture}">watered</b> and <b tooltip="${TooltipID.soilFertility}">fertile</b> soil, wait a few moments and you have a plant!`,
        [TooltipID.inspectNone]: `Disable inspection mode.`
    }
}

/* export class UITooltipDataFake {
    soilErosion: string = `Eroded soil is cracked and unstable. It cannot hold ${tooltipFake.soilWater} and it dries out quickly. Grow plants to remove erosion.`
    soilWater: string = `Eroded soil is cracked and unstable. It cannot hold ${tooltipFake.soilErosion} and it dries out quickly. Grow plants to remove erosion.`
}
let tooltipFake: Record<keyof UITooltipDataFake, string> = Object.fromEntries(Object.keys(UITooltipDataFake).map(key => ([key, key]))) as any;
 */