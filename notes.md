1. Frontend handled by javascript and html/css. Does the WebRTC stuff
2. Backend will handle
    - WEbRTC signaling, ice, STUN/TURN
    - Nat traversal, codecs, jitter, packet loss
    - Concurrency and asyncio
    - Operational thinking
    - auth
    - room management
    - Metrics and logging
    - Testing
3. First write backend in python, maybe write a rust version if I'm trying to learn Rust
4. Also can write an admin dashboard using Ruby on Rails if I want to further boost my learning of Ruby

- Most webrtc stuff will be handled in the browser
- The server will ONLY handle signalging and auth
    - Basically, I want to store user data so that you can make accounts and have friends who you can call and all that
    - However, the server will only really be somewhere that websockets can connect to and transfer offers and answers between two peers
    - If I decide to add group chats, then it'll be much beefier, but we can look into that later
- TURN server can be hosted on my VPS, since I have an unmetered connection

- Basic architecture though: browsers handle majority of webrtc stuff in terms of generating offers and accepting answers
                             Signaling servers handle sending offers and answers between clients
                             TURN server is the fallback for when NAT traversal is REALLY hard

- Should be able to make an account and call friends OR there should be a "call chirayu" button. Want that to 
work real good so that recruiters can call me


