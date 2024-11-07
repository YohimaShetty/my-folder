const express = require('express');
const fs = require('fs').promises;
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const complaintsQueue = [];
const resolvedStack = [];

function prioritizeComplaint(complaint) {
    complaintsQueue.push(complaint);
    complaintsQueue.sort((a, b) => b.urgency - a.urgency);
}

async function logResolvedComplaints() {
    const data = resolvedStack.map(c => `${c.id},${c.details},${c.status}`).join('\n');
    await fs.writeFile('resolved_complaints.csv', data, 'utf8');
}

app.post('/complaint', (req, res) => {
    const { id, details, urgency } = req.body;
    const complaint = { id, details, urgency, status: 'unresolved' };
    prioritizeComplaint(complaint);
    res.status(201).json({ message: `Complaint with ID ${id} added and prioritized.` });
});

app.get('/complaints', (req, res) => {
    res.status(200).json(complaintsQueue);
});

app.put('/resolve/:id', async (req, res) => {
    const complaintId = req.params.id;
    const index = complaintsQueue.findIndex(c => c.id === complaintId);

    if (index !== -1) {
        const resolvedComplaint = complaintsQueue.splice(index, 1)[0];
        resolvedComplaint.status = 'resolved';
        resolvedStack.push(resolvedComplaint);

        await logResolvedComplaints();
        res.json({ message: `Complaint with ID ${complaintId} resolved and logged.` });
    } else {
        res.status(404).json({ message: 'Complaint not found.' });
    }
});

app.get('/resolved-logs', async (req, res) => {
    try {
        const data = await fs.readFile('resolved_complaints.csv', 'utf8');
        res.status(200).send(data);
    } catch (error) {
        res.status(500).json({ message: 'Error reading resolved complaints log.' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
