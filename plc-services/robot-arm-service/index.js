const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
const PORT = 4050;

let robotState = { position: {x: 10, y: 20, z: 30}, status: 'Active', load: 15 };

app.get('/position', (req, res) => res.json(robotState.position));
app.get('/status', (req, res) => res.json({ status: robotState.status }));
app.get('/load', (req, res) => res.json({ value: robotState.load }));

app.post('/move', (req, res) => {
  robotState.position = { ...robotState.position, ...req.body };
  res.json(robotState.position);
});

app.post('/trigger', (req, res) => {
  if (req.body.failure) {
    robotState.status = 'Error';
  }
  res.json(robotState);
});

app.listen(PORT, () => console.log(`Robot Arm Service running on port ${PORT}`));
