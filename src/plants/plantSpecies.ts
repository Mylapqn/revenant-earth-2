export class PlantSpecies {
    name = "Species name";
    statsPerGrowth:PlantStatsPerGrowth;
    statsPerTime:PlantStatsPerTime;
    generatorData:PlantGeneratorData;
    constructor(name: string, statsPerGrowth: PlantStatsPerGrowth, statsPerTime: PlantStatsPerTime, generatorData: PlantGeneratorData) {
        this.name = name;
        this.statsPerGrowth = statsPerGrowth;
        this.statsPerTime = statsPerTime;
        this.generatorData = generatorData;
        PlantSpecies.species.set(name, this);
    }
    static species: Map<string, PlantSpecies> = new Map<string, PlantSpecies>();
}

export type PlantStatsPerGrowth = { co2: number; nutrients: number; biomass: number; water: number; erosion: number,maxGrowth: number };
export type PlantStatsPerTime = { pollution: number; water: number; pollutionDamage: number };
export type PlantGeneratorData = { initialBranches: number; lengthPerGrowth: number; leaves: boolean };