// TODO: chagne pending offer name to something better
// TODO: Better modularization and seperation
// TODO: Figure out how to remove echo playback from local video stream
// TODO: Better error handling
// TODO: Camera selection based on device id
// TODO: Live camera changing
// TODO: Mobile camera front vs back?
// TODO: Set output device for audio
// TODO: For webrtc, find out how to have one way audio

window.addEventListener("DOMContentLoaded", async () => {
    // VARIABLES
    const state = {
        userID: "",
        pendingOffer: ""
    };

    const idText = document.getElementById("IdDisplay");
    const callInput = document.getElementById("callInput")
    const callButton = document.getElementById("callButton")
    const incomingCallDiv = document.getElementById("incomingCall");
    const incomingCallText = document.getElementById("incomingCaller");
    const incomingCallAcceptButton = document.getElementById("acceptCall")
    const incomingCallDeclineButton = document.getElementById("declineCall")
    const localVideoFullscreen = document.getElementById("localVideoFullscreen")
    const localVideoDiv = document.getElementById("localVideoOnly")
    const localVideoPip = document.getElementById("localVideoPip")
    const localAndRemoteVideoDiv = document.getElementById("localAndRemoteVideo")

    const iceServers = [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun.l.google.com:5349" },
        { urls: "stun:stun1.l.google.com:3478" },
        { urls: "stun:stun1.l.google.com:5349" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:5349" },
        { urls: "stun:stun3.l.google.com:3478" },
        { urls: "stun:stun3.l.google.com:5349" },
        { urls: "stun:stun4.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:5349" }
    ];
    const streamConstraints = {
      audio: true,
      video: {
        width: { min: 1024, ideal: 1280, max: 1920 },
        height: { min: 576, ideal: 720, max: 1080 },
      },
    };

    // Declare these variables
    let localStream = null;
    let peerConnection = null;

    // WEBSOCKET - Initialize first, don't wait for media
    const websocket = new WebSocket("ws://localhost:8765/");
    
    websocket.addEventListener("open", () => {
        console.log("WebSocket connected!");
        const initConnection = {
            state: "init"
        };
        websocket.send(JSON.stringify(initConnection));
    });

    websocket.addEventListener("error", (error) => {
        console.error("WebSocket error:", error);
    });

    websocket.addEventListener("close", () => {
        console.log("WebSocket closed");
    });

    websocket.addEventListener("message", async ({ data }) => {
        const event = JSON.parse(data);

        switch (event.state) {
            case "addUserId":
                state.userID = event.data.userID;
                console.log("User id:", state.userID);
                idText.textContent = state.userID;
                break;
            case "pendingOffer":
                console.log(event);
                state["pendingOffer"] = {
                    callerID : event.data.callerID,
                    offer : event.data.offer
                };
                console.log(state);
                incomingCallText.textContent = `Recieving call from: ${state.pendingOffer.callerID}`;
                incomingCallDiv.classList.toggle('hidden');
                break;
            case "recievedAnswer":
                if (peerConnection) {
                    await peerConnection.setRemoteDescription(event.data.answer);
                }
                break;
            case "receiveIceCandidate":
                if (peerConnection) {
                    await peerConnection.addIceCandidate(event.data.candidate);
                    console.log("Added ICE candidate");
                }
                break;
        }
    });

    // Initialize media and peer connection - this runs in parallel with WebSocket
    (async () => {
        try {
            console.log("Requesting media access...");
            localStream = await navigator.mediaDevices.getUserMedia(streamConstraints);
            console.log("Media access granted");
            
            if (localStream) {
                localVideoFullscreen.srcObject = localStream;
                localVideoDiv.classList.remove('hidden');
            }

            // Create peer connection AFTER getting the stream
            peerConnection = new RTCPeerConnection({iceServers: iceServers});
            
            // Add tracks to peer connection
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });

            // Set up track listener
            const remoteVideo = document.querySelector('#remoteVideo');
            peerConnection.addEventListener('track', async (event) => {
                const [remoteStream] = event.streams;
                remoteVideo.srcObject = remoteStream;
                localVideoPip.srcObject = localStream; 
                localVideoDiv.classList.add('hidden');
                localAndRemoteVideoDiv.classList.remove('hidden');
                localVideoFullscreen.srcObject = null
                console.log("Completed remote video setting");

            });

            // Add ICE candidate handler
            peerConnection.addEventListener('icecandidate', (event) => {
                if (event.candidate) {
                    console.log("Sending ICE candidate");
                    websocket.send(JSON.stringify({
                        state: "sendIceCandidate",
                        data: {
                            // if the caller is sending to reciever, we need to send to call input's value
                            // if the person recieving the call is deaaling with candidates, we need to look at the pending offer
                            // Both of this will not be filled at once, so we chillin
                            to: callInput.value || state.pendingOffer.callerID, 
                            candidate: event.candidate
                        }
                    }));
                }
            });

            console.log("Peer connection initialized successfully");
        } catch (error) {
            console.error("Error initializing media/peer connection:", error);
        }
    })();

    // OTHER DOM INTERACTIONS
    callButton.addEventListener("click", async (event) => {
        event.preventDefault();

        if (!peerConnection) {
            console.error("Peer connection not ready yet");
            return;
        }

        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            
            const sendUserInfo = {
                state : "sendOffer",
                data : {
                    callerID: state.userID,
                    receiverID: callInput.value,
                    offer: peerConnection.localDescription
                }
            };

            websocket.send(JSON.stringify(sendUserInfo));
        } catch (error) {
            console.error(error);
        }
    });

    incomingCallDeclineButton.addEventListener("click", (event) => {
        event.preventDefault();
        incomingCallDiv.classList.toggle('hidden');
    });

    incomingCallAcceptButton.addEventListener("click", async (event) => {
        event.preventDefault();

        if (!peerConnection) {
            console.error("Peer connection not ready yet");
            return;
        }

        console.log("State before we use it for session description", state);
        
        try {
            // First, set our remote description to whatever was given to us
            await peerConnection.setRemoteDescription(state.pendingOffer.offer);

            // Now we send our local description to the other client to set
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            
            const sendUserInfo = {
                state : "sendAnswer",
                data : {
                    to : state.pendingOffer.callerID,
                    answer: peerConnection.localDescription
                }
            };
            
            websocket.send(JSON.stringify(sendUserInfo));
        } catch (error) {
            console.error("Error accepting call:", error);
        }
    });
});
