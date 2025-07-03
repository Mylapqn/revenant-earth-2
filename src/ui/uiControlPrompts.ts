import { UIElement } from "./uiElement";

export class UIControlPrompts {
    container:UIElement;
    prompts:UIElement[] = [];
    constructor(parent:HTMLElement) {
        this.container = new UIElement({type:"div",classes:["controlPromptContainer"],parent:parent});
        /*this.addPrompt(["A","D"],"Move");
        this.addPrompt(["Space"],"Jump");*/
        //this.addPrompt(["Q"],"Inspect terrain");
        this.addPrompt(["E"],"Building menu");
        this.addPrompt(["TAB"],"Inventory");
        this.addPrompt(["M"],"Test planet view");
    }
    addPrompt(keys:string[],text:string) {
        const wrapper = new UIElement({type:"div",classes:["controlPrompt"],parent:this.container.htmlElement});
        const textElement = new UIElement({type:"div",classes:["text"],parent:wrapper.htmlElement});
        textElement.htmlElement.innerText = text;
        for (const key of keys) {
            const keyElement = new UIElement({type:"div",classes:["key"],parent:wrapper.htmlElement});
            keyElement.htmlElement.innerText = key;
        }
        this.prompts.push(wrapper);
    }
    remove() {
        this.container.remove();
    }
}