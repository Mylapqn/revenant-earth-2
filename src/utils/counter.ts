import { Container } from "pixi.js";
import { game } from "../game";

export function objcount(value: any, path: Array<string>, ignore: Array<string>, score: Map<string, number>, depth = 4, count = 0, seen = new WeakSet()): number {
    if (value === null) return count;
    if (typeof value === "object") {
        if (seen.has(value)) return count;
        seen.add(value);

        if (ignore.includes(path.join("."))) return count;

        for (let index = 0; index < path.length; index++) {
            const p = path.slice(0, index + 1).join(".");
            if (score.has(p)) {
                score.set(p, score.get(p)! + 1);
            } else {
                score.set(p, 1);
            }
        }

        try {
            if (value instanceof Array) {
                for (let i = 0; i < value.length; i++) {
                    const pth = [...path];
                    if (pth.length < depth) pth.push(i.toString());
                    count = objcount(value[i], pth, ignore, score, count, depth, seen);
                }
            } else {
                for (const key in value) {
                    if (key.startsWith("_")) continue;
                    const pth = [...path];
                    if (pth.length < depth) pth.push(key);
                    count = objcount(value[key], pth, ignore, score, count, depth, seen);
                }
            }
            return count + 1;
        } catch (error) {
            return count;
        }
    }

    return count;
}

export function countContainerChildren(value: any, path: Array<string>, ignore: Array<string>, score: Map<string, number>, count = 0, seen = new WeakSet()): number {
    if (value === null) return count;
    if (typeof value === "object") {
        if (seen.has(value)) return count;
        seen.add(value);

        if (ignore.includes(path.join("."))) return count;

        // Only process if it's a Container
        if (value instanceof Container || true) {
            // Count the current container's children
            for (let index = 0; index < path.length; index++) {
                const p = path.slice(0, index + 1).join(".");
                if (score.has(p)) {
                    score.set(p, score.get(p)! + 1);
                } else {
                    score.set(p, 1);
                }
            }

            try {
                // Process children (which might also be containers)
                if (value.children && Array.isArray(value.children)) {
                    for (let i = 0; i < value.children.length; i++) {
                        const child = value.children[i];
                        const pth = [...path];
                        if (pth.length < 4) pth.push(i.toString());
                        count = countContainerChildren(child, pth, ignore, score, count, seen);
                    }
                }
            } catch (error) {
                return count;
            }
            return count + 1;
        }
    }

    return count;
}
