window.addEventListener("DOMContentLoaded", () => {
    // VARIABLES
    const websocket = new WebSocket("ws://localhost:8765/");
    const state = {
        userID: ""
    };
    const idText = document.getElementById("IdDisplay");
    const callInput = document.getElementById("callInput")
    const callButton = document.getElementById("callButton")

    // WEBSOCKET COMMUNICATION PACKETS
    const initConnection = {
        state: "init"
    };

    // WEBSOCKET EVENT LISTENERS
    websocket.addEventListener("open", () => {
        websocket.send(JSON.stringify(initConnection));
    });

    websocket.addEventListener("message", ({ data }) => {
        const event = JSON.parse(data);

        switch (event.state) {
            case "addUserId":
                state.userID = event.data.userID
                console.log("User id:", state.userID)
                idText.textContent = state.userID
                break;
        }
    })

    // OTHER DOM INTERACTIONS
    callButton.addEventListener("click", (event) => {
        event.preventDefault();
        
        const sendUserInfo = {
            state : "sendOffer",
            data : {
                callerID: state.userID,
                receiverID: callInput.value
            }
        }

        websocket.send(JSON.stringify(sendUserInfo))
    })
})
