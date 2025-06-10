import { game } from "../game";
import { UI, UIElement } from "../ui/ui";
import { lerp } from "../utils/utils";

export class Score {
    display!: UIElement;
    currentDisplay: number = 0;
    accumulation = 0;
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
    }
}