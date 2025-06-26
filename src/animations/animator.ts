
export class Animator {
    private activeAnimations = new Map<any, Animation>();

    async play(id: any, animation: Animation) {
        const existing = this.activeAnimations.get(id);
        if (existing) {
            existing._cancel();
        }

        this.activeAnimations.set(id, animation);

        return animation._start().finally(() => {
            // Only clear if it hasn't been replaced mid-flight
            if (this.activeAnimations.get(id) === animation) {
                this.activeAnimations.delete(id);
            }
        });
    }

    cancel(id: any): void {
        const anim = this.activeAnimations.get(id);
        if (anim) {
            anim._cancel();
            this.activeAnimations.delete(id);
        }
    }

    cancelAll(): void {
        for (const [id, anim] of this.activeAnimations.entries()) {
            anim._cancel();
        }
        this.activeAnimations.clear();
    }
}

export interface Animation {
    _start(): Promise<boolean>;
    _cancel(): void;
}

