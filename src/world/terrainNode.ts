import { Vector } from "../utils/vector";


export class TerrainNode extends Vector {
    next: TerrainNode | null = null;

    constructor(x: number = 0, y: number = 0) {
        super(x, y);
    }

    burn(till?: TerrainNode) {
        if (till == this.next) return;
        this.next?.burn(till);
        this.next = null;
    }

    static *[Symbol.iterator](node: TerrainNode): IterableIterator<TerrainNode> {
        while (node) {
            yield node;
            node = node.next!;
        }
    }
}

export class TerrainMesh implements Iterable<TerrainNode> {
    head: TerrainNode | null = null;
    tail: TerrainNode | null = null;

    push(node: TerrainNode) {
        if (this.head === null) this.head = node;
        if (this.tail) this.tail.next = node;
        this.tail = node;
    }

    pop(): TerrainNode | null {
        const node = this.tail;
        if (this.tail) this.tail = this.tail.next;
        return node;
    }

    *[Symbol.iterator](): IterableIterator<TerrainNode> {
        let node = this.head;
        while (node) {
            yield node;
            node = node.next!;
        }
    }
}