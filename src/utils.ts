export class RandomGenerator {
    seed: number = 0;
    constructor(seed: number) {
        this.seed = seed;
    }
    float() {
        const result = this.mulberry32(this.seed);
        this.seed += parseInt((result + '').charAt(3)) * 100 + 1
        return result;
    }
    range(min: number, max: number) {
        return (this.float() * (max - min) + min);
    }
    int(min: number, max: number) {
        return Math.floor(this.range(min, max));
    }
    private mulberry32(a: number) {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

export function clamp(n: number) {
    return Math.min(1, Math.max(0, n));
}

export function displayNumber(n: number, digits = 2) {
    return parseFloat(n.toFixed(digits)).toString();
}
