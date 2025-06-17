import { game } from "../game";
import { QuestMarker } from "../ui/questMarker";
import { nextFrame, sleep } from "../utils/utils";
import { Vector } from "../utils/vector";
import { Entity } from "./entity";

export type SubMilestoneOptions = {
    id: string,
    name: string,
    reward: number,
    parent?: Milestone,
    details?: string,
    celebrate?: boolean,
    onIssue?: (milestone: Milestone) => void
    onComplete?: (data?: any) => void,
};

export type MilestoneOptions = SubMilestoneOptions & {
    tier?: number,
    subTasks?: SubMilestoneOptions[],
    sequential?: boolean,
    issueImmediately?: boolean
};

export class Milestone {
    reward = 0;
    private _completed = false;
    tier: number;
    name: string;
    parent?: Milestone;
    children: Milestone[] = [];
    id: string;
    sequential = true;
    enabled = false;
    details?: string;
    celebrate = true;
    issueImmediately = false;
    marker?: QuestMarker;
    onIssue?: (milestone: Milestone) => void;
    onComplete?: (data?: any) => void;
    public get completed() {
        return this._completed;
    }
    constructor(options: MilestoneOptions) {
        this.details = options.details;
        this.id = options.id;
        this.name = options.name;
        this.tier = options.tier ?? 0;
        this.sequential = options.sequential ?? true;
        const reward = options.reward;
        this.parent = options.parent;
        this.celebrate = options.celebrate ?? true;
        this.issueImmediately = options.issueImmediately ?? false;
        this.onComplete = options.onComplete;
        this.onIssue = options.onIssue;
        if (this.parent) {
            this.tier = this.parent.tier;
        }
        if (options.subTasks) this.children = options.subTasks.map(task => {
            task.parent = this;
            const child = new Milestone(task);
            if (!this.sequential) child.enabled = true;
            return child;
        });
        game.milestones.milestones.set(this.id, this);
        this.reward = reward ?? 0;
        if (options.issueImmediately && this.tier == game.milestones.currentTier) this.issue();
    }

    async complete(detailsText?: string, data?: any) {
        if (this._completed) return;
        if (this.tier != game.milestones.currentTier || !this.enabled) return;
        this._completed = true;

        let celebrate = this.celebrate;
        if (celebrate) {
            this.completionGraphics(detailsText, data);
        }
        else {
            game.score.add(this.reward);
        }

        if (this.marker) this.marker.remove();

        await nextFrame();

        if (this.onComplete) this.onComplete(data);
        game.milestones.displayQuests();
        this.parent?.checkChildren();
    }

    private async completionGraphics(detailsText?: string, data?: any) {
        game.milestones.popups.add({ type: "complete", questName: this.name, detailsText, reward: this.reward });
    }

    private async checkChildren(delay = 0) {
        if (this.children.length == 0) return;
        if (this.sequential) this.issueNextChild();
        for (const child of this.children) {
            if (!child.completed) return false;
        }
        if (delay)
            await sleep(delay);
        this.complete();
    }
    private issueNextChild() {
        let previousCompleted = true;
        for (let i = 0; i < this.children.length; i++) {
            if (previousCompleted && !this.children[i].enabled) {
                this.children[i].issue();
            }
            previousCompleted = this.children[i].completed;
        }
    }
    issue(silent = false) {
        console.log("Issuing milestone", this.name);
        if (!this.enabled) {
            this.enabled = true;
            if (!silent)
                game.milestones.popups.add({ type: "issue", questName: this.name, detailsText: this.details });
            this.checkChildren();
            game.milestones.displayQuests();
            if (this.onIssue) this.onIssue(this);
        }
    }
}

