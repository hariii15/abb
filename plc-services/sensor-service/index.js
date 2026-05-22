const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = 4020;

// Helper to generate simulated data
const randomRange = (min, max) => (Math.random() * (max - min) + min).toFixed(2);

// Simulated data states
let forcedTemperature = null;

app.get('/temperature', (req, res) => {
  const temp = forcedTemperature !== null ? forcedTemperature : randomRange(20, 80);
  res.json({ value: parseFloat(temp), unit: 'C' });
});

app.get('/pressure', (req, res) => {
  res.json({ value: parseFloat(randomRange(1, 10)), unit: 'bar' });
});

app.get('/vibration', (req, res) => {
  res.json({ value: parseFloat(randomRange(0.1, 5.0)), unit: 'mm/s' });
});

app.get('/humidity', (req, res) => {
  res.json({ value: parseFloat(randomRange(30, 60)), unit: '%' });
});

app.get('/proximity', (req, res) => {
  res.json({ value: parseFloat(randomRange(0, 100)), unit: 'cm' });
});

// Admin endpoint to force a state
app.post('/trigger', express.json(), (req, res) => {
  const { type, value } = req.body;
  if (type === 'temperature') forcedTemperature = value;
  res.json({ message: 'Triggered' });
});

app.listen(PORT, () => {
  console.log(`Sensor Service running on port ${PORT}`);
});
