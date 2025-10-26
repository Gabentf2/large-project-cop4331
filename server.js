const express = require('express');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const url = process.env.MONGODB_URI;
const client = new MongoClient(url);
const mongoose = require('mongoose');
const mongoUri = process.env.MONGODB_URI;
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('mongoose connected'))
  .catch(err => console.error('mongoose connection error', err));
 
client.connect();
const bodyParser = require('body-parser');
const cors = require('cors');
const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');
const { startCleanup } = require('./utils/cleanup');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
//app.use('/api/events', eventRoutes);
app.use('/', userRoutes);
//app.use('/api/events', eventRoutes);

// Start server
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
	// Start periodic cleanup of expired events. Interval can be set with
	// the CLEANUP_INTERVAL_MS environment variable (milliseconds).
	try {
		startCleanup();
	} catch (err) {
		console.error('Failed to start cleanup scheduler', err);
	}
});
