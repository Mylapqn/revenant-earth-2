import Plant from "../components/custom/plant";
import { TreeGenerator } from "./generators/treeGenerator";
import { PlantGenerator } from "./plantGenerator";

export type GeneratorConstructor<T> = { new(plant: Plant): T };


export class PlantSpecies {
    name = "Species name";
    statsPerGrowth: PlantStatsPerGrowth;
    statsPerTime: PlantStatsPerTime;
    generatorData: PlantGeneratorData;
    generatorConstructor: GeneratorConstructor<PlantGenerator>;
    constructor(name: string, statsPerGrowth: PlantStatsPerGrowth, statsPerTime: PlantStatsPerTime, generatorData: PlantGeneratorData, generator?: GeneratorConstructor<PlantGenerator>) {
        this.name = name;
        this.generatorConstructor = TreeGenerator;
        this.statsPerGrowth = statsPerGrowth;
        this.statsPerTime = statsPerTime;
        this.generatorData = generatorData;
        PlantSpecies.species.set(name, this);
    }
    static species: Map<string, PlantSpecies> = new Map<string, PlantSpecies>();
}

export type PlantStatsPerGrowth = { co2: number; nutrients: number; biomass: number; water: number; erosion: number, maxGrowth: number };
export type PlantStatsPerTime = { pollution: number; water: number; pollutionDamage: number, grassiness: number };
export type PlantGeneratorData = { initialBranches: number; lengthPerGrowth: number; leaves: boolean };