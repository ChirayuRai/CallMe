import { MediaManager } from './webrtc/MediaManager.js';
import { PeerConnectionManager } from './webrtc/PeerConnectionManager.js';
import { WebSocketManager } from './websocket/WebSocketManager.js';
import { UIManager } from './ui/UIManager.js';

class VideoCallApp {
    constructor() {
        this.mediaManager = new MediaManager();
        this.uiManager = new UIManager();
        this.peerConnectionManager = null;
        this.websocketManager = null;
    }

    async initialize() {
        // Initialize media first
        await this.mediaManager.initializeLocalStream();

        // Initialize peer connection
        this.peerConnectionManager = new PeerConnectionManager(
            this.mediaManager,
            (candidate) => this.handleIceCandidate(candidate),
            (remoteStream) => this.mediaManager.setRemoteStream(remoteStream)
        );
        this.peerConnectionManager.initialize();

        // Initialize WebSocket
        this.websocketManager = new WebSocketManager(
            (event) => this.handleWebSocketMessage(event)
        );
        this.websocketManager.connect();

        // Inject buttons into UI
        this.uiManager.setupButtons();

        // Setup UI event listeners
        this.uiManager.setupEventListeners(
            () => this.handleCall(),
            () => this.handleAcceptCall(),
            () => this.handleDeclineCall()
        );
    }

    handleIceCandidate(candidate) {
        const to = this.uiManager.getCallInputValue() || 
                   this.uiManager.getPendingOffer()?.callerID;
        
        if (to) {
            this.websocketManager.sendIceCandidate(to, candidate);
        }
    }

    async handleWebSocketMessage(event) {
        switch (event.state) {
            case "addUserId":
                this.uiManager.setUserId(event.data.userID);
                break;

            case "pendingOffer":
                this.uiManager.showIncomingCall(
                    event.data.callerID,
                    event.data.offer
                );
                break;

            case "recievedAnswer":
                if (this.peerConnectionManager.isReady()) {
                    await this.peerConnectionManager.setRemoteDescription(event.data.answer);
                }
                break;

            case "receiveIceCandidate":
                if (this.peerConnectionManager.isReady()) {
                    await this.peerConnectionManager.addIceCandidate(event.data.candidate);
                }
                break;
        }
    }

    async handleCall() {
        if (!this.peerConnectionManager.isReady()) {
            console.error("Peer connection not ready yet");
            return;
        }

        try {
            const offer = await this.peerConnectionManager.createOffer();
            this.websocketManager.sendOffer(
                this.uiManager.getUserId(),
                this.uiManager.getCallInputValue(),
                offer
            );
        } catch (error) {
            console.error("Error creating call:", error);
        }
    }

    async handleAcceptCall() {
        if (!this.peerConnectionManager.isReady()) {
            console.error("Peer connection not ready yet");
            return;
        }

        try {
            const pendingOffer = this.uiManager.getPendingOffer();
            const answer = await this.peerConnectionManager.createAnswer(pendingOffer.offer);
            this.websocketManager.sendAnswer(pendingOffer.callerID, answer);
            this.uiManager.hideIncomingCall();
        } catch (error) {
            console.error("Error accepting call:", error);
        }
    }

    handleDeclineCall() {
        this.uiManager.deletePendingOffer();
        this.uiManager.hideIncomingCall();
    }
}

// Initialize the app
window.addEventListener("DOMContentLoaded", async () => {
    const app = new VideoCallApp();
    await app.initialize();
});
