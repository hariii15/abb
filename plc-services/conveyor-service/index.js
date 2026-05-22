const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
const PORT = 4040;

let conveyorState = { speed: 2.5, load: 80, throughput: 1200 };

app.get('/speed', (req, res) => res.json({ value: conveyorState.speed }));
app.post('/speed', (req, res) => {
  conveyorState.speed = req.body.speed;
  res.json(conveyorState);
});
app.get('/load', (req, res) => res.json({ value: conveyorState.load }));

app.post('/trigger', (req, res) => {
  if (req.body.delay) {
    conveyorState.speed = 0.5;
    conveyorState.throughput = 300;
  }
  res.json(conveyorState);
});

app.listen(PORT, () => console.log(`Conveyor Service running on port ${PORT}`));
