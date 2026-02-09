"""
Signalling server for calling with WebRTC
"""

import asyncio
import json
import uuid

from websockets.asyncio.server import serve

# TODO: Put server url into env file
# TODO: Update implementation to have database and auth

# TODO: Start creating the offer and sending it to the client
# Keep in mind that answer setting needs to be done on both clients too

SERVER_BASE = "localhost"
SERVER_PORT = 8765
connections = dict()

async def handler(websocket):
    id = uuid.uuid4()
    connections[id] = websocket
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
                    print(f"Sending offer, here's the event: {event}")

        await websocket.wait_closed()
    finally:
        print(f"Closing connection: {id}")
        del connections[id]


async def server():
    async with serve(handler, SERVER_BASE, SERVER_PORT) as server:
        # Close the server when receiving SIGTERM.
        await server.serve_forever()


if __name__ == "__main__":
    print(f"Opened websocket server at {SERVER_BASE}:{SERVER_PORT}")
    asyncio.run(server())
