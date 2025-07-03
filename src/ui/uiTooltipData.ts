
export type TooltipID = keyof typeof UITooltipData.data;
export class UITooltipData {
    static data = {
        "soil-erosion": `Eroded soil is cracked and unstable. It cannot hold <b tooltip="soil-moisture">moisture</b> and it dries out quickly. Grow <b tooltip="plants">plants</b> to remove erosion.`,
        "soil-moisture": `Moisture means how much water the soil contains. <b tooltip="plants">Plants</b> need it to grow and survive. <b tooltip="soil-erosion">Eroded</b> soil dries out quickly.`,
        "soil-fertility": `Fertility means how much nutrients the soil contains. Like <b tooltip="soil-moisture">moisture</b>, It is necessary for the growth of <b tooltip="plants">plants</b>, however it is not as important for their survival.`,
        "soil-toxicity": `Toxic soil sucks.`,
        "air-pollution": `Polluted air sucks.`,
        "air-temperature": `Hot air means unstable weather and high <b tooltip="soil-erosion">erosion</b>.`,
        "air-co2": `Co2 means <b tooltip="air-temperature">hot air</b>.`,
        "plants": `Plant a seed in <b tooltip="soil-moisture">watered</b> and <b tooltip="soil-fertility">fertile</b> soil, wait a few moments and you have a plant!`,
        "inspect-none": `Disable inspection mode.`
    }
}
