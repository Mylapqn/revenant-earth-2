import Hitbox from "../components/generic/hitbox";
import { game } from "../game";
import { MouseButton } from "../input";
import { displayNumber } from "../utils/utils";
import { Vector, Vectorlike } from "../utils/vector";
import { Debug } from "./debug";

export class HitboxEditor {
    editing = false;
    editedNodes: Vectorlike[] = [];
    editedHitbox?: Hitbox;
    selectedNode?: Vectorlike;
    getNode(index: number) {
        if (index >= this.editedNodes.length) index -= this.editedNodes.length;
        if (index < 0) index += this.editedNodes.length;
        return this.editedNodes[index];
    }
    startEditing(hitbox: Hitbox) {
        if (this.editing) return;
        this.editedNodes = hitbox.originalNodes;
        this.editedHitbox = hitbox;
        this.editing = true;
    }
    stopEditing() {
        if (!this.editing) return;
        this.editing = false;
        this.editedHitbox = undefined;
        this.editedNodes = [];
    }
    update() {
        if (!this.editing || !this.editedHitbox) return;
        Debug.drawHitbox(this.editedHitbox, { color: 0xffffff, width: .5 });
        const offset = this.editedHitbox.transform.position;
        const offsetMouse = new Vector(game.worldMouse.x - offset.x, game.worldMouse.y - offset.y);
        for (const node of this.editedNodes) {
            Debug.graphicsWorldspace.circle(node.x + offset.x, node.y + offset.y, 1);
            Debug.graphicsWorldspace.fill(0xffff00);
        }

        if (this.selectedNode) {
            const gridSnap = game.input.key("control") ? 10 : 1;
            this.selectedNode.x = offsetMouse.x;
            this.selectedNode.y = offsetMouse.y;
            this.selectedNode.x = Math.floor(this.selectedNode.x / gridSnap) * gridSnap;
            this.selectedNode.y = Math.floor(this.selectedNode.y / gridSnap) * gridSnap;
            //snap to next and prev node axis
            const index = this.editedNodes.indexOf(this.selectedNode);
            const prevNode = this.getNode(index - 1);
            const nextNode = this.getNode(index + 1);
            if (gridSnap == 1) {
                if (Math.abs(this.selectedNode.x - prevNode.x) < 5) {
                    this.selectedNode.x = prevNode.x;
                }
                if (Math.abs(this.selectedNode.x - nextNode.x) < 5) {
                    this.selectedNode.x = nextNode.x;
                }
                if (Math.abs(this.selectedNode.y - prevNode.y) < 5) {
                    this.selectedNode.y = prevNode.y;
                }
                if (Math.abs(this.selectedNode.y - nextNode.y) < 5) {
                    this.selectedNode.y = nextNode.y;
                }
            }
            if (game.input.mouse.getButtonUp(MouseButton.Left)) {
                //test if nodes merged
                if (Vector.fromLike(this.selectedNode).distance(nextNode) < 5) {
                    this.editedNodes.splice(this.editedNodes.indexOf(nextNode), 1);
                }
                if (Vector.fromLike(this.selectedNode).distance(prevNode) < 5) {
                    this.editedNodes.splice(this.editedNodes.indexOf(prevNode), 1);
                }

                this.selectedNode = undefined;
            }
        }
        else {
            const nearestMiddle = this.nearestMiddle(offsetMouse);
            const nearestNode = this.editedNodes[Vector.nearestPositionIndex(offsetMouse, this.editedNodes.map(node => new Vector(node.x, node.y)))];
            const nearestNodeDistance = Vector.fromLike(nearestNode).distance(offsetMouse);
            if (nearestNodeDistance < nearestMiddle.distance && nearestNodeDistance < 10) {
                Debug.graphicsWorldspace.circle(nearestNode.x + offset.x, nearestNode.y + offset.y, 2);
                Debug.graphicsWorldspace.stroke(0xffff00);
                if (game.input.mouse.getButtonDown(MouseButton.Left)) {
                    this.selectedNode = nearestNode;
                }
            }
            else if (nearestMiddle.distance < nearestNodeDistance && nearestMiddle.distance < 30) {
                if (nearestMiddle.distance < 10) {
                    const middle = nearestMiddle.middle;
                    Debug.graphicsWorldspace.circle(middle.x + offset.x, middle.y + offset.y, 2);
                    Debug.graphicsWorldspace.stroke(0x00ff00);
                    if (game.input.mouse.getButtonDown(MouseButton.Left)) {
                        //add new node
                        this.editedNodes.splice(nearestMiddle.index + 1, 0, middle);
                        this.selectedNode = middle;
                        this.editedHitbox.applyNodes(this.editedNodes);
                    }
                }
            }
        }

        if (game.input.mouse.getButtonUp(MouseButton.Left)) {
            this.editedHitbox.applyNodes(this.editedNodes);
            const output = JSON.stringify(this.editedNodes.map(node => { return { x: parseFloat(displayNumber(node.x, 1)), y: parseFloat(displayNumber(node.y, 1)) } }));
            //console.log(output);
            //clipboard output
            navigator.clipboard.writeText(output);
        }
        if (game.input.keyUp("escape")) {
            this.stopEditing();
        }
    }
    nearestMiddle(position: Vectorlike) {
        let nearestMiddle: Vector = new Vector(0, 0);
        let nearestIndex = -1;
        let nearestDistance = Infinity;
        for (let i = 0; i < this.editedNodes.length; i++) {
            const node = Vector.fromLike(this.editedNodes[i])//.add(this.editedHitbox!.transform.position);
            const nextNode = Vector.fromLike(this.getNode(i + 1))//.add(this.editedHitbox!.transform.position);
            const middle = Vector.lerp(node, nextNode, .5);
            const distance = middle.distance(position);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = i;
                nearestMiddle = middle;
            }
        }
        return { middle: nearestMiddle, distance: nearestDistance, index: nearestIndex };
    }
}