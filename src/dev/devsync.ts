import { game } from "../game";
import { Entity } from "../hierarchy/entity";
import { KindedObject } from "../hierarchy/serialise";

export class DevSync {
    static ws: WebSocket;
    static init() {
        this.ws = new WebSocket("ws://localhost:3001");
        this.ws.onopen = () => {
            console.log("Connected to WebSocket server");
        };

        this.ws.onmessage = (event) => {
            console.log("Received updated entity data");
            const data = JSON.parse(event.data);
            const entity = game.activeScene.findEntity(parseInt(data.id));
            if (entity != undefined) {
                entity.applyData(data);
            } else {
                Entity.fromData(data, game.activeScene);
            }
        };
    }

    static trigger(data: KindedObject) {
        this.ws.send(JSON.stringify(data));
    }
}
