export class UI {
    static customDiv(parent:HTMLElement,...classes:string[]){
        const div = document.createElement("div");
        div.classList.add(...classes);
        parent.appendChild(div);
        return div;
    }
}