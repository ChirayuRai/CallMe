import { ICE_SERVERS } from '../config/constants.js';

export class PeerConnectionManager {
    constructor(mediaManager, onIceCandidate, onTrack) {
        this.peerConnection = null;
        this.mediaManager = mediaManager;
        this.onIceCandidate = onIceCandidate;
        this.onTrack = onTrack;
        this.iceCandidateQueue = [];  
    }

    initialize() {
        this.peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        
        // Add local tracks
        const localStream = this.mediaManager.getLocalStream();
        console.log("Local stream from peer conn:", localStream)
        localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, localStream);
        });
        console.log("Local stream after adding tracks:", localStream)
        console.log("Local stream's tracks after adding tracks:", localStream.getTracks());

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

    async flushIceCandidateQueue() {
        while (this.iceCandidateQueue.length > 0) {
            const candidate = this.iceCandidateQueue.shift();
            console.log("Flushing queued ICE candidate");
            await this.peerConnection.addIceCandidate(candidate);
        }
    }

    async setRemoteDescription(description) {
        await this.peerConnection.setRemoteDescription(description);
        await this.flushIceCandidateQueue();
    }

    async createAnswer(offer) {
        await this.peerConnection.setRemoteDescription(offer);
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        await this.flushIceCandidateQueue();
        return answer;
    }

    async createOffer() {
        console.log("About to create offer")
        const offer = await this.peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });
        console.log("Offer:", offer)
        console.log("Offer sdp:", offer.sdp)
        await this.peerConnection.setLocalDescription(offer);
        return offer;
    }

    async addIceCandidate(candidate) {
        if (!this.peerConnection.remoteDescription) {
            console.log("Remote description not set yet, queuing candidate");
            this.iceCandidateQueue.push(candidate);
            return;
        }
        await this.peerConnection.addIceCandidate(candidate);
    }

    isReady() {
        return this.peerConnection !== null;
    }
}
