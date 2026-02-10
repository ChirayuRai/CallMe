import { WEBSOCKET_URL } from '../config/constants.js';

export class WebSocketManager {
    constructor(onMessage) {
        this.websocket = null;
        this.onMessage = onMessage;
    }

    connect() {
        this.websocket = new WebSocket(WEBSOCKET_URL);
        
        this.websocket.addEventListener("open", () => {
            console.log("WebSocket connected!");
            this.send({ state: "init" });
        });

        this.websocket.addEventListener("error", (error) => {
            console.error("WebSocket error:", error);
        });

        this.websocket.addEventListener("close", () => {
            console.log("WebSocket closed");
        });

        this.websocket.addEventListener("message", async ({ data }) => {
            const event = JSON.parse(data);
            this.onMessage(event);
        });
    }

    send(message) {
        this.websocket.send(JSON.stringify(message));
    }

    sendOffer(callerID, receiverID, offer) {
        this.send({
            state: "sendOffer",
            data: { callerID, receiverID, offer }
        });
    }

    sendAnswer(to, answer) {
        this.send({
            state: "sendAnswer",
            data: { to, answer }
        });
    }

    sendIceCandidate(to, candidate) {
        this.send({
            state: "sendIceCandidate",
            data: { to, candidate }
        });
    }
}
