import { STREAM_CONSTRAINTS } from '../config/constants.js';
import { elements } from '../ui/elements.js';

// SET VIDEO STUFF HERE
export class MediaManager {
    constructor() {
        this.localStream = null;
    }

    async initializeLocalStream() {
        try {
            console.log("Requesting media access...");
            this.localStream = await navigator.mediaDevices.getUserMedia(STREAM_CONSTRAINTS);
            console.log("Media access granted");
            
            elements.localVideoFullscreen.srcObject = this.localStream;
            elements.mainIdleIn.classList.add('hidden');
            elements.localVideoFullscreen.classList.remove('hidden');
            
            return this.localStream;
        } catch (error) {
            console.error("Error initializing media:", error);
            throw error;
        }
    }

    // TODO: Fix this entire thing because it has now been broken by Vercel :)
    setRemoteStream(remoteStream) {
        elements.remoteVideo.srcObject = remoteStream;
        elements.localVideoPip.srcObject = this.localStream;
        elements.localVideoDiv.classList.add('hidden');
        elements.localAndRemoteVideoDiv.classList.remove('hidden');
        elements.localVideoFullscreen.srcObject = null;
        console.log("Completed remote video setting");
    }

    getLocalStream() {
        return this.localStream;
    }
}
