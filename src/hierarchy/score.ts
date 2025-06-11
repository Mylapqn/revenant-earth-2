import { game } from "../game";
import { UI, UIElement } from "../ui/ui";
import { lerp } from "../utils/utils";
import { Vector, Vectorlike } from "../utils/vector";

export class Score {
    display!: UIElement;
    currentDisplay: number = 0;
    accumulation = 0;
    particles: Vector[] = [];
    particlesQueue: Vectorlike[] = [];
    particleAccumulation = 0;
    set score(score: number) {
        game.progressDatabase.db.set("score", score);
    }
    get score(): number {
        return game.progressDatabase.db.get("score") ?? 0;
    }
    pay(amount: number) {
        if (this.score < amount)
            return false;
        else
            this.score -= amount;
        return true;
    }
    add(amount: number) {
        this.score += amount;
    }
    addWithFx(amount: number, screenPosition: Vectorlike) {
        this.score += amount;
        for (let i = 0; i < amount / 5; i++) {
            this.particlesQueue.push(Vector.fromLike(screenPosition).add(new Vector(Math.random() - .5, Math.random() - .5).mult(.05)));
        }
    }
    init() {
        this.display = UIElement.create({ type: "div", classes: ["score"], parent: UI.container });
        this.score = this.score;
    }
    update(dt: number) {
        const sign = Math.sign(this.score - this.currentDisplay);
        const oldDisplay = this.currentDisplay;
        let diff = Math.abs(this.score - this.currentDisplay);
        if (diff < 2) {
            this.currentDisplay = this.score;
            this.accumulation = 0;
        }
        else {
            const add = Math.max(0, diff * dt * 3) * sign
            this.accumulation += add;
        }
        while (Math.abs(this.accumulation) > 1) {
            this.currentDisplay += Math.sign(this.accumulation);
            this.accumulation -= Math.sign(this.accumulation);
        }
        this.currentDisplay = Math.floor(this.currentDisplay);
        if (oldDisplay != this.currentDisplay) {
            //game.soundManager.soundLibrary.play("score", { volume: 0.01 });
        }
        this.display.htmlElement.textContent = this.currentDisplay.toString();
        this.updateParticles(dt);
    }
    updateParticles(dt: number) {
        if (this.particlesQueue.length > 0) {
            this.particleAccumulation += dt * this.particlesQueue.length * 2;
            while (this.particleAccumulation > 1 && this.particlesQueue.length > 0) {
                this.particles.push(game.camera.renderToScreen(this.particlesQueue.shift()!));
                this.particleAccumulation -= 1;
                game.soundManager.soundLibrary.play("score", { volume: 0.1 });
            }
        }
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i] = Vector.lerp(this.particles[i], game.camera.renderToScreen({ x: 1, y: 0 }), dt * 3);
            game.uiGraphics.circle(this.particles[i].x, this.particles[i].y, 10);
            if (game.camera.renderToScreen({ x: 1, y: 0 }).distance(this.particles[i]) < 100) {
                this.particles.splice(i, 1);
                i--;
            }
        }
        game.uiGraphics.fill(0x55ee11);
    }
}