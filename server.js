const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

let commandQueue = {};
let activePlayers = {}; // { userId: { username: "...", lastSeen: timestamp } }

// Ping endpoint for clients to register themselves as active
app.post('/ping', (req, res) => {
    const { userId, username } = req.body;
    if (!userId) return res.status(400).send({ error: "Missing userId" });

    activePlayers[userId] = {
        username: username || "Unknown",
        lastSeen: Date.now()
    };
    res.send({ success: true });
});

// Endpoint for Owner to get the list of active script users
app.get('/players', (req, res) => {
    const now = Date.now();
    // Clean up players who haven't pinged in the last 15 seconds
    for (const id in activePlayers) {
        if (now - activePlayers[id].lastSeen > 15000) {
            delete activePlayers[id];
        }
    }
    res.json(activePlayers);
});

// Endpoint for Owner to send commands
app.post('/send', (req, res) => {
    const { targetId, action } = req.body;
    if (!targetId || !action) return res.status(400).send({ error: "Missing data" });

    if (!commandQueue[targetId]) commandQueue[targetId] = [];
    commandQueue[targetId].push(action);
    
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

app.listen(PORT, () => console.log(`Relay Server running on port ${PORT}`));
