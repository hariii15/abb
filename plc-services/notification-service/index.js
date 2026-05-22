const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
const PORT = 4080;

app.post('/send', (req, res) => {
  console.log('Notification sent:', req.body.message);
  res.json({ success: true, message: 'Notification sent' });
});

app.listen(PORT, () => console.log(`Notification Service running on port ${PORT}`));
