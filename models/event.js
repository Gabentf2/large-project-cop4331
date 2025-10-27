const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
	
	VideoGameID: { type: String, required: true }, //functionally a title
	StartDate: { type: Date, required: false },
	EndDate: { type: Date,required: false  },
	//Image-link: {type: String, required: false  }, implement this shit later

});
const Event = mongoose.model('Event', eventSchema);

module.exports = Event;