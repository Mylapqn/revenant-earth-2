import { nextFrame, sleep } from "../utils/utils";
import { Animation } from "./animator";


export class GenericAnimation implements Animation {
    private cancelled = false;

    constructor(
        private config: {
            duration: number;
            before?: () => Promise<void> | void;
            after?: () => Promise<void> | void;
        }
    ) {
    }

    _cancel() {
        this.cancelled = true;
    }

    async _start(): Promise<boolean> {
        if (this.cancelled) return false;

        if (this.config.before) {
            await this.config.before?.();
            await nextFrame();
        }

        if (this.cancelled) return false;

        await nextFrame();
        if (this.cancelled) return false;

        await sleep(this.config.duration);
        if (this.cancelled) return false;

        await this.config.after?.();
        if (this.cancelled) return false;
        return true;
    }
}
