const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4010;

// In-memory data store for PLC logic
let machines = [
  { id: 'M-101', status: 'Running', health: 100 },
  { id: 'M-102', status: 'Running', health: 95 },
  { id: 'M-103', status: 'Maintenance', health: 40 },
];

app.get('/machines', (req, res) => {
  res.json(machines);
});

app.post('/command', (req, res) => {
  const { machineId, action } = req.body;
  console.log(`Received command for ${machineId}: ${action}`);
  
  const machine = machines.find(m => m.id === machineId);
  if (machine) {
    if (action === 'start') machine.status = 'Running';
    if (action === 'stop') machine.status = 'Stopped';
  }
  
  res.json({ message: `Command ${action} received for ${machineId}`, machine });
});

app.post('/execute', (req, res) => {
  const { script } = req.body;
  console.log(`Executing PLC logic: ${script}`);
  res.json({ message: 'PLC Logic executed' });
});

// Periodic PLC logic cycle (simulated scan cycle)
setInterval(async () => {
  try {
    // In a real system, the PLC polls sensors
    // await axios.get('http://localhost:4020/temperature');
  } catch (error) {
    console.log('Error polling sensors');
  }
}, 5000);

app.listen(PORT, () => {
  console.log(`PLC Controller Service running on port ${PORT}`);
});
