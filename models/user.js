const mongoose = require("mongoose");
const Schema = mongoose.Schema;
//Create Schema
const UserSchema = new Schema({
UserId: {
type: Number
},
DisplayName: { //remove?
type: String,
required: true
},
Password: {
type: String,
required: true
},
Email: {
type: String,
required: true
},
// Array of Event IDs owned by this user
OwnedEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
}]
});
module.exports = user = mongoose.model("Users", UserSchema);