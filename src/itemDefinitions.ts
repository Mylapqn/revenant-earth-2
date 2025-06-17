
export enum ItemGroup {
    Tool,
    Seed
}

export enum Item {
    tree,
    grass,
    sprinkler,
    biocharKiln,
    battery
}


export type ItemDefinition = {
    group: ItemGroup
    name: string,
    description: string,
    icon: string
}

export const itemDefinitions: Record<Item, ItemDefinition> = {
    [Item.tree]: {
        group: ItemGroup.Seed,
        name: "Tree",
        description: "Tree description",
        icon: "tree.png"
    },
    [Item.grass]: {
        group: ItemGroup.Seed,
        name: "Grass",
        description: "Grass description",
        icon: "tree.png"
    },
    [Item.sprinkler]: {
        group: ItemGroup.Tool,
        name: "Sprinkler",
        description: "Vite, ze nic nesprinkler",
        icon: "vite.svg"
    },
    [Item.biocharKiln]: {
        group: ItemGroup.Tool,
        name: "Biochar Kiln",
        description: "Biochar, ze nic neskilnkler",
        icon: "vite.svg"
    },
    [Item.battery]: {
        group: ItemGroup.Tool,
        name: "Battery",
        description: "Ba, ze nic terry",
        icon: "vite.svg"
    },
}