import doorHitbox from ".././environment/doorHitbox.json";
export const scene2data = [
    {
        kind: "Entity",
        component: [
            {
                componentType: "BasicSprite",
                data: {
                    asset: "./door.png",
                },
            },
            {
                componentType: "Interactable",
            },
            {
                componentType: "Door",
                data: {
                    target: "Scene",
                    doorId: "dungeon-door-1",
                },
            },
            {
                componentType: "Transform",
                data: {
                    position: { x: 40, y: 20 },
                    velocity: { x: 0, y: 0 },
                },
            },
        ],
    },
    {
        kind: "Entity",
        component: [
            {
                componentType: "BasicSprite",
                data: {
                    asset: "./robo.png",
                },
            },
            {
                componentType: "Interactable",
            },
            {
                componentType: "Button",
                data: {
                    dbName: "pollutionSpeed",
                },
            },
            {
                componentType: "Transform",
                data: {
                    position: { x: 10, y: 20 },
                    velocity: { x: 0, y: 0 },
                },
            },
        ],
    },
    {
        kind: "Entity",
        component: [
            {
                componentType: "Transform",
                data: {
                    position: { x: 40, y: 0 },
                    velocity: { x: 0, y: 0 },
                },
            },
            {
                componentType: "Hitbox",
                data: {
                    nodes: doorHitbox,
                    interior: true,
                },
            },
        ],
    },
    {
        kind: "Player",
        position: { x: 10, y: 0 },
        velocity: { x: 0, y: 0 },
    },
];