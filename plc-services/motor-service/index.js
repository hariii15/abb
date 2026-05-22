const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
const PORT = 4030;

let motorState = { status: 'Running', rpm: 1500, voltage: 380, temperature: 45, current: 12 };

app.get('/status', (req, res) => res.json({ status: motorState.status }));
app.get('/rpm', (req, res) => res.json({ value: motorState.rpm }));
app.get('/temperature', (req, res) => res.json({ value: motorState.temperature }));
app.get('/voltage', (req, res) => res.json({ value: motorState.voltage }));
app.get('/current', (req, res) => res.json({ value: motorState.current }));

app.post('/trigger', (req, res) => {
  const { failure } = req.body;
  if (failure) {
    motorState.status = 'Failed';
    motorState.rpm = 0;
    motorState.current = 0;
    motorState.temperature = 90; // Overheat
  }
  res.json(motorState);
});

app.listen(PORT, () => console.log(`Motor Service running on port ${PORT}`));
