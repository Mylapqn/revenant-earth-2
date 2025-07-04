import { Graphics } from "pixi.js";
import Plant from "../components/custom/plant";
import { PlantSpecies } from "./plantSpecies";

export class PlantGenerator {
    name = "name";
    species: PlantSpecies;
    plant: Plant;
    graphics: Graphics;
    constructor(plant: Plant) {
        this.plant = plant;
        this.graphics = plant.graphics;
        this.species = plant.species;
    }
    render() {

    }
}