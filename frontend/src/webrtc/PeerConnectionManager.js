import { ICE_SERVERS } from '../config/constants.js';

export class PeerConnectionManager {
    constructor(mediaManager, onIceCandidate, onTrack) {
        this.peerConnection = null;
        this.mediaManager = mediaManager;
        this.onIceCandidate = onIceCandidate;
        this.onTrack = onTrack;
    }

    initialize() {
        this.peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        
        // Add local tracks
        const localStream = this.mediaManager.getLocalStream();
        localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, localStream);
        });

        // Set up event listeners
        this.peerConnection.addEventListener('icecandidate', (event) => {
            if (event.candidate) {
                console.log("Sending ICE candidate");
                this.onIceCandidate(event.candidate);
            }
        });

        this.peerConnection.addEventListener('track', (event) => {
            const [remoteStream] = event.streams;
            this.onTrack(remoteStream);
        });

        console.log("Peer connection initialized successfully");
    }

    async createOffer() {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        return this.peerConnection.localDescription;
    }

    async createAnswer(offer) {
        await this.peerConnection.setRemoteDescription(offer);
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        return this.peerConnection.localDescription;
    }

    async setRemoteDescription(description) {
        await this.peerConnection.setRemoteDescription(description);
    }

    async addIceCandidate(candidate) {
        await this.peerConnection.addIceCandidate(candidate);
        console.log("Added ICE candidate");
    }

    isReady() {
        return this.peerConnection !== null;
    }
}
