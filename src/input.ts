import { Game } from "./game";
import { Vector } from "./vector";

export class Input {
    mouse: Mouse;
    heldKeys: Map<string, boolean>;
    keysUp: Map<string, boolean>;
    keysDown: Map<string, boolean>;
    constructor() {
        this.mouse = new Mouse();
        this.heldKeys = new Map<string, boolean>();
        this.keysUp = new Map<string, boolean>();
        this.keysDown = new Map<string, boolean>();
        window.addEventListener("keydown", e => this.onKeyDown(e));
        window.addEventListener("keyup", e => this.onKeyUp(e));
    }
    onKeyDown(e: KeyboardEvent) {
        const key = e.key.toLowerCase();
        this.heldKeys.set(key, true);
        this.keysDown.set(key, true);
        switch (key) {
            case "tab":
                e.preventDefault();
        }
    }
    onKeyUp(e: KeyboardEvent) {
        const key = e.key.toLowerCase();
        this.heldKeys.set(key, false);
        this.keysUp.set(key, true);
    }
    public key(key: string) {
        return this.heldKeys.get(key.toLowerCase()) ?? false;
    }
    public keyUp(key: string) {
        return this.keysUp.get(key.toLowerCase()) ?? false;
    }
    public keyDown(key: string) {
        return this.keysDown.get(key.toLowerCase()) ?? false;
    }
    public update() {
        this.mouse.update();
        this.keysUp = new Map<string, boolean>();
        this.keysDown = new Map<string, boolean>();
    }
}

export enum MouseButton {
    Left,
    Right,
    Wheel,
    Mouse4,
    Mouse5,
}

class Mouse {
    public position;
    public pixelPosition;
    public delta;
    public pixelDelta;
    public buttonsHeld = 0;
    public lastButtonsHeld = 0;
    public scroll = 0;
    public getButton(button: MouseButton) {
        return this.buttonsHeld & (1 << (button));
    }
    public getButtonUp(button: MouseButton) {
        return this.lastButtonsHeld & (1 << (button)) && !(this.buttonsHeld & (1 << (button)));
    }
    public getScroll() {
        return this.scroll;
    }
    constructor() {
        this.position = new Vector();
        this.delta = new Vector();
        this.pixelPosition = new Vector();
        this.pixelDelta = new Vector();
        window.addEventListener("mousedown", e => this.mouseButtons(e));
        window.addEventListener("mouseup", e => this.mouseButtons(e));
        window.addEventListener("mousemove", e => this.mouseMove(e));
        window.addEventListener("wheel", e => this.mouseScroll(e));
        document.addEventListener('contextmenu', event => event.preventDefault());
    }
    mouseButtons(e: MouseEvent) {
        this.buttonsHeld = e.buttons;
    }
    mouseMove(e: MouseEvent) {
        this.position.set(e.clientX, e.clientY);
        this.pixelPosition = this.position.result().mult(1 / Game.pixelScale).floor();
        this.delta.set(e.movementX, e.movementY);
        this.pixelDelta = this.delta.result().mult(1 / Game.pixelScale).floor();
    }
    mouseScroll(e: WheelEvent) {
        this.scroll = e.deltaY / 100;
    }
    movedThisFrame() {
        return (this.delta.x !== 0 || this.delta.y !== 0);
    }
    public update() {
        this.pixelDelta.set(0, 0);
        this.delta.set(0, 0);
        this.scroll = 0;
        this.lastButtonsHeld = this.buttonsHeld;
    }
}
