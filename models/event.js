const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
	title: { type: String, required: true }, //remove?
	VideoGameID: { type: String, required: true },
	StartDate: { type: Date, required: false },
	EndDate: { type: Date,required: false  },

});
const Event = mongoose.model('Event', eventSchema);

module.exports = Event;