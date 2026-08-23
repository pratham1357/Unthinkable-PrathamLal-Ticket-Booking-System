require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { startCron } = require('./utils/holdCleaner');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api', require('./routes/waitlist'));
app.use('/api', require('./routes/organizer'));
app.use('/api', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startCron();
});