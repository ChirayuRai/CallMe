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
# dict mapping websocket connections to connection IDs
CONNECTIONS = {}       

async def message_user(connection_id, message):
    try:
        websocket = CONNECTIONS[connection_id]  # raises KeyError if user disconnected
        await websocket.send(json.dumps(message))  # may raise websockets.exceptions.ConnectionClosed
    except KeyError as k:
        print(f"Had an error which caused the user to disconnect: {k}")
    except ConnectionClosed as cc:
        print(f"Connection closed error: {cc}")
    except Exception as e:
        print(f"Exception occured in message_user: {e}")

async def handler(websocket):
    id = uuid.uuid4()
    CONNECTIONS[str(id)] = websocket
    try:
        async for message in websocket:
            event = json.loads(message)
            match event["state"]:
                # When client initially connects, generate
                # a connection ID for them and save it
                case "init":
                    print(f"Initializing connection with id: {id}")

                    # Sending over the connection id to the new user
                    send_to_user = {
                        "state" : "addConnectionId",
                        "data" : {
                            "connectionID" : str(id)
                        },
                    }
                    await websocket.send(json.dumps(send_to_user))
                case "sendOffer":
                    # Start a call with another user
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
                    # Accept a call from another user
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
                    # After SDP connection stuff happens, the media that's being sent
                    # is accepted. However, that doesn't guarantee bidrectional 
                    # communication can actually occur. To overcome that, we use 
                    # ICE Candidates. It basically just tests a whole bunch of
                    # different ways to try and establish this connection, and 
                    # finishes up when a working version has been found. 
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
