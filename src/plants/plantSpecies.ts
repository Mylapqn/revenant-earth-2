export class PlantSpecies {
    name = "Species name";
    statsPerGrowth = {
        co2: 0,
        nutrients: 0,
        biomass: 0,
        water: 0,
        erosion: 0
    }
    statsPerTime = {
        pollution : 0,
        water: 0
    }
    generatorData = {
        initialBranches: 1,
        lengthPerGrowth: 1,
        leaves:true
    };
    constructor(name: string, statsPerGrowth: PlantStatsGrowth, statsPerTime: PlantStatsTime, generatorData?: any) {
        this.name = name;
        this.statsPerGrowth = statsPerGrowth;
        this.statsPerTime = statsPerTime;
        this.generatorData = generatorData || this.generatorData;
        PlantSpecies.species.set(name, this);
    }
    static species: Map<string, PlantSpecies> = new Map<string, PlantSpecies>();
}

export type PlantStatsGrowth = {
    co2: number,
    nutrients: number,
    biomass: number,
    water: number,
    erosion: number
}

export type PlantStatsTime = {
    pollution: number,
    water: number
}