"""
Signalling server for calling with WebRTC
"""

import asyncio
import json
import uuid

from websockets.asyncio.server import serve
from websockets.exceptions import ConnectionClosed

# TODO: Put server url into env file
# TODO: Update implementation to have database and auth

# TODO: Start creating the offer and sending it to the client
# Keep in mind that answer setting needs to be done on both clients too

# TODO: Send the offer, that's the start of the call
# When the other client accepts the offer and generates an answer, that's accepting the call and finishing the handshake
# type beat

SERVER_BASE = "localhost"
SERVER_PORT = 8765
CONNECTIONS = {}

async def message_user(user_id, message):
    try:
        websocket = CONNECTIONS[user_id]  # raises KeyError if user disconnected
        await websocket.send(json.dumps(message))  # may raise websockets.exceptions.ConnectionClosed
    except KeyError as k:
        print(f"We had a key error: {k}")
    except ConnectionClosed as cc:
        print(f"Connection closed error: {cc}")
    except Exception as e:
        print(f"Exception occured: {e}")

async def handler(websocket):
    id = uuid.uuid4()
    CONNECTIONS[str(id)] = websocket
    try:
        async for message in websocket:
            event = json.loads(message)
            match event["state"]:
                # When client initially connects, generate
                # a user ID for them and save it
                case "init":
                    print(f"Initializing connection with id: {id}")
                    await websocket.send(json.dumps({
                        "state" : "addUserId",
                        "data" : {
                            "userID" : str(id)
                        },
                    }))
                case "sendOffer":
                    print(f"Offer sent: {event}")
                    data = event["data"]
                    send_to_user = {
                        "state": "pendingOffer",
                        "data": {
                            "callerID" : data["callerID"],
                            "offer" : data["offer"]
                        }
                    }
                    await message_user(data["receiverID"], send_to_user)
                case "sendAnswer":
                    print(event)
                    data = event["data"]
                    sent_to_user = {
                        "state" : "recievedAnswer",
                        "data" : {
                            "answer" : data["answer"]
                        }
                    }
                    await message_user(data["to"], sent_to_user)
                case "sendIceCandidate":
                    data = event["data"]
                    await message_user(data["to"], {
                        "state": "receiveIceCandidate",
                        "data": {
                            "candidate": data["candidate"]
                        }
                    })

        await websocket.wait_closed()
    finally:
        print(f"Closing connection: {id}")
        del CONNECTIONS[str(id)]


async def server():
    async with serve(handler, SERVER_BASE, SERVER_PORT) as server:
        # Close the server when receiving SIGTERM.
        await server.serve_forever()


if __name__ == "__main__":
    print(f"Opened websocket server at {SERVER_BASE}:{SERVER_PORT}")
    asyncio.run(server())
