import { Entity } from "../hierarchy/entity";
import { UI, UIElement, UIAbsoluteElement } from "./ui";
import { game } from "../game";
import { Vector } from "../utils/vector";
import { displayNumber } from "../utils/utils";
import { Debug } from "../dev/debug";

//TODO: Currently the marker doesn't load or unload with scenes, but references scene objects. Could become a scene object and serializable, which would also automate updating
export class QuestMarker {
    static list: QuestMarker[] = [];
    parentEntity?: Entity
    parentElement: UIAbsoluteElement;
    arrowElement: UIElement
    textElement: UIElement
    textDimensions: Vector = new Vector(0, 0);
    removeWhenClose = false;
    constructor(public position: Vector, public text: string, removeWhenClose?: boolean) {
        this.removeWhenClose = removeWhenClose ?? false;
        this.parentElement = new UIAbsoluteElement("div", this.position, "marker");
        UI.container.appendChild(this.parentElement.htmlElement);
        this.parentElement.blockMouse = false;
        this.arrowElement = UIElement.create({ type: "div", parent: this.parentElement.htmlElement, classes: ["arrow"],blockMouse: false });
        this.textElement = UIElement.create({ type: "p", parent: this.parentElement.htmlElement, content: text,blockMouse: false });
        QuestMarker.list.push(this);
    }
    static atEntity(entity: Entity, text: string, removeWhenClose?: boolean) {
        const marker = new QuestMarker(entity.transform.position, text, removeWhenClose);
        marker.parentEntity = entity;
        return marker;
    }
    static init() {
        if (QuestMarker.list.length > 0) {
            for (const marker of [...QuestMarker.list]) {
                marker.remove();
            }
        }
        QuestMarker.list = [];
    }
    static update() {
        for (const marker of QuestMarker.list) {
            marker.update();
        }
    }
    update() {
        if (this.parentEntity) this.position = this.parentEntity.transform.position.clone().add(new Vector(0, -50));
        if (game.camera.inView(this.position, -200)) {
            this.parentElement.setWorldPosition(this.position);
            this.setArrow(new Vector(0, 1));
            if (this.removeWhenClose && this.position.distanceSquared(game.player.position) < 80 * 80) {
                this.remove();
                return;
            }
        }
        else {
            let renderPos = game.camera.renderToCentered(game.camera.worldToRender(this.position));
            let padding = new Vector(1, 1).sub(game.camera.screenToRender(new Vector(400, 400)));
            const scaleX = padding.x / Math.abs(renderPos.x);
            const scaleY = padding.y / Math.abs(renderPos.y);
            const scale = Math.min(scaleX, scaleY);
            renderPos = renderPos.mult(scale);
            const centeredPos = renderPos.clone();

            renderPos = game.camera.centeredToRender(renderPos);

            this.parentElement.setRenderPosition(renderPos);
            this.setArrow(centeredPos);
        }
    }
    setArrow(centeredPos: Vector) {
        if (this.textDimensions.x == 0) this.textDimensions = new Vector(this.textElement.htmlElement.offsetWidth, this.textElement.htmlElement.offsetHeight);
        const arrowOffset = centeredPos.clone().vecmult(this.textDimensions.clone().mult(0.5).add(new Vector(40, 15)));
        this.arrowElement.htmlElement.style.left = arrowOffset.x + "px";
        this.arrowElement.htmlElement.style.top = arrowOffset.y + "px";
        const angle = centeredPos.toAngle();
        this.arrowElement.htmlElement.style.rotate = `${angle - Math.PI / 4}rad`;
    }
    remove() {
        const index = QuestMarker.list.indexOf(this);
        if (index > -1) {
            this.parentElement.remove();
            QuestMarker.list.splice(index, 1);
        }
    }
}