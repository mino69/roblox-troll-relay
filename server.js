const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
let commandQueue = {};

app.post('/send', (req, res) => {
    const { targetId, action } = req.body;
    if (!targetId || !action) return res.status(400).send({ error: "Missing data" });

    if (!commandQueue[targetId]) commandQueue[targetId] = [];
    commandQueue[targetId].push(action);

    console.log(`[TrollSystem] Command sent to ${targetId}: ${action}`);
    res.send({ success: true });
});

app.get('/poll/:userId', (req, res) => {
    const userId = req.params.userId;
    const commands = commandQueue[userId] || [];
    commandQueue[userId] = []; 
    res.json({ commands: commands });
});

app.listen(PORT, () => console.log(`Relay Server running on port ${PORT}`));