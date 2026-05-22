const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
const PORT = 4060;

let alerts = [
  { id: 1, type: 'Warning', message: 'Temperature approaching limit', time: new Date() }
];

app.get('/alerts', (req, res) => {
  res.json(alerts);
});

app.post('/trigger', (req, res) => {
  const { type, message } = req.body;
  const newAlert = { id: alerts.length + 1, type, message, time: new Date() };
  alerts.unshift(newAlert);
  res.json(newAlert);
});

app.listen(PORT, () => console.log(`Alarm Service running on port ${PORT}`));
