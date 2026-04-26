require('dotenv').config();
const express = require('express');
const cors = require('cors');

const alertRoutes = require('./routes/alert');
const locationRoutes = require('./routes/location');
const userRoutes = require('./routes/user');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/alert', alertRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/user', userRoutes);

app.get('/', (req, res) => res.json({ status: 'SafeGuard API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
