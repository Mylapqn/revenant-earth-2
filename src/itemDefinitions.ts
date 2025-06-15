
export enum ItemGroup {
    Tool,
    Seed
}

export enum Item {
    tree,
    grass,
    vite
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
    [Item.vite]: {
        group: ItemGroup.Tool,
        name: "Vite",
        description: "Vite, ze nic nevite",
        icon: "vite.svg"
    }
}