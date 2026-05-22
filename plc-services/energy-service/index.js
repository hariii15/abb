const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
const PORT = 4070;

const randomRange = (min, max) => (Math.random() * (max - min) + min).toFixed(2);

app.get('/consumption', (req, res) => {
  res.json({ value: parseFloat(randomRange(50, 200)), unit: 'kW' });
});

app.get('/peak', (req, res) => {
  res.json({ value: 250, unit: 'kW', time: new Date() });
});

app.listen(PORT, () => console.log(`Energy Service running on port ${PORT}`));
