import { Component } from "../hierarchy/component";
import type { ComponentRegistry } from "./types";

export function initComponents() {
    const componentModules = import.meta.glob([
        './custom/*.ts',
        './generic/*.ts'
    ], { eager: true });
    
    for (const path in componentModules) {
        const module = componentModules[path] as { default: typeof Component };
        if (module.default && module.default.prototype instanceof Component) {
            Component.register(module.default);
        }
    }
}


export type ComponentData = {
    id?: number,
} & {
    [K in keyof ComponentRegistry]: {
        componentType: K,
        data?: ComponentDataOf<ComponentRegistry[K]>
    }
}[keyof ComponentRegistry];
type ComponentDataOf<T extends Component> = Parameters<T["applyData"]>[0]