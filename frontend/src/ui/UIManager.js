import { elements } from './elements.js';

export class UIManager {
    constructor() {
        this.state = {
            userID: "",
            pendingOffer: null
        };
    }

    setUserId(userId) {
        this.state.userID = userId;
        elements.idText.textContent = userId;
    }

    getUserId() {
        return this.state.userID;
    }

    showIncomingCall(callerID, offer) {
        this.state.pendingOffer = { callerID, offer };
        elements.incomingCallText.textContent = `Receiving call from: ${callerID}`;
        elements.incomingCallDiv.classList.remove('hidden');
    }

    hideIncomingCall() {
        elements.incomingCallDiv.classList.add('hidden');
    }

    getPendingOffer() {
        return this.state.pendingOffer;
    }

    getCallInputValue() {
        return elements.callInput.value;
    }

    setupEventListeners(onCall, onAccept, onDecline) {
        elements.callButton.addEventListener("click", (e) => {
            e.preventDefault();
            onCall();
        });

        elements.incomingCallAcceptButton.addEventListener("click", (e) => {
            e.preventDefault();
            onAccept();
        });

        elements.incomingCallDeclineButton.addEventListener("click", (e) => {
            e.preventDefault();
            onDecline();
        });
    }
}
