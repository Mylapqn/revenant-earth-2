
export enum ItemGroup {
    Building,
    Seed
}

export enum Item {
    tree = "tree",
    grass = "grass",
    bush = "bush",
    sprinkler = "sprinkler",
    biocharKiln = "biocharKiln",
    battery = "battery",
    solarPanel = "solarPanel"
}


export type ItemDefinition = {
    group: ItemGroup
    name: string,
    description: string,
    icon: string,
    cost: number
}

export const itemDefinitions: Record<Item, ItemDefinition> = {
    [Item.tree]: {
        group: ItemGroup.Seed,
        name: "Black poplar",
        description: "Populus nigra",
        icon: "tree.png",
        cost: 200,
    },
    [Item.grass]: {
        group: ItemGroup.Seed,
        name: "Vetiver grass",
        description: "Chrysopogon zizanioides",
        icon: "grass.png",
        cost: 50
    },
    [Item.bush]: {
        group: ItemGroup.Seed,
        name: "Sea buckthorn",
        description: "Hippophae rhamnoides",
        icon: "bush.png",
        cost: 100
    },
    [Item.sprinkler]: {
        group: ItemGroup.Building,
        name: "Sprinkler",
        description: "Provides water to plants",
        icon: "gfx/building/water_tank.png",
        cost: 1000
    },
    [Item.biocharKiln]: {
        group: ItemGroup.Building,
        name: "Biochar Kiln",
        description: "Processes plants to store CO2",
        icon: "gfx/building/biochar.png",
        cost: 500
    },
    [Item.battery]: {
        group: ItemGroup.Building,
        name: "Battery",
        description: "Stores energy",
        icon: "gfx/building/battery.png",
        cost: 1000
    },
    [Item.solarPanel]: {
        group: ItemGroup.Building,
        name: "Solar Panel",
        description: "Provides energy during the day",
        icon: "gfx/building/solar_panel.png",
        cost: 1000
    },
}