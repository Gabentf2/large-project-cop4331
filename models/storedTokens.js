const mongoose = require('mongoose');

const storedTokenSchema = new mongoose.Schema({
    token: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Users' },
    createdAt: { type: Date, default: Date.now, expires: 3600 } // Token expires after 1 hour
});

const StoredToken = mongoose.model('StoredToken', storedTokenSchema);

module.exports = StoredToken;   

//just stores the tokens for comparing and verifying.