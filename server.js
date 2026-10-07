const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

let commandQueue = {};
let activePlayers = {}; // { userId: { username: "...", position: {...}, lastSeen: timestamp } }
let storedPositions = {}; // For Goto feature

// Ping endpoint for clients to register presence and coordinates
app.post('/ping', (req, res) => {
    const { userId, username, position } = req.body;
    if (!userId) return res.status(400).send({ error: "Missing userId" });

    activePlayers[userId] = {
        username: username || "Unknown",
        position: position || null,
        lastSeen: Date.now()
    };
    res.send({ success: true });
});

// Endpoint for Owner to get the list of active script users
app.get('/players', (req, res) => {
    const now = Date.now();
    for (const id in activePlayers) {
        if (now - activePlayers[id].lastSeen > 15000) {
            delete activePlayers[id];
        }
    }
    res.json(activePlayers);
});

// Endpoint for Owner to send commands with optional payloads
app.post('/send', (req, res) => {
    const { targetId, action, payload } = req.body;
    if (!targetId || !action) return res.status(400).send({ error: "Missing data" });

    if (!commandQueue[targetId]) commandQueue[targetId] = [];
    commandQueue[targetId].push({ action, payload });
    
    console.log(`[TrollSystem] Command sent to ${targetId}: ${action}`);
    res.send({ success: true });
});

// Endpoint for Target clients to poll commands
app.get('/poll/:userId', (req, res) => {
    const userId = req.params.userId;
    const commands = commandQueue[userId] || [];
    commandQueue[userId] = []; 
    res.json({ commands: commands });
});

// Store position endpoint for Goto feature
app.post('/storepos', (req, res) => {
    const { userId, x, y, z } = req.body;
    if (!userId) return res.status(400).send({ error: "Missing userId" });
    storedPositions[userId] = { x, y, z };
    res.send({ success: true });
});

app.listen(PORT, () => console.log(`Relay Server running on port ${PORT}`));
