const express = require('express');
const router = express.Router();
const Event = require('../models/event');
const User = require('../models/user');
const authenticateToken = require('../middleware/auth'); //chatgpt garbage that might not be used...
const StoredToken = require('../models/storedToken');
var LocalStorage = require('node-localstorage').LocalStorage;
LocalStorage = new LocalStorage('./scratch');
const mongoose = require('mongoose');
function inTheFuture(date, hours) {
    const toAdd = hours * 60 * 60 * 1000; // hours to milliseconds
    return new Date(date.getTime() + toAdd);
}

// POST /api/createEvent
// Authenticated. Uses token payload.userId as owner.
// Body: { title, VideoGameID, StartDate?, EndDate? }
router.post('/api/createEvent', async (req, res) => {
    try { //works (tested with ARC)
        const {  VideoGameID, StartDate, EndDate, OwnerID } = req.body;
        //const tokenUserId = req.user && req.user.userId;
        //if (!tokenUserId) return res.status(401).json({ error: 'Invalid token payload' });
        //dont remember what i was even using tokens for in this. wont bother not needed?

        if (!VideoGameID) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const start = StartDate ? new Date(StartDate) : new Date();
        const end = EndDate ? new Date(EndDate) : inTheFuture(start, 2);

        const event = new Event({
            //title,
            VideoGameID,
            StartDate: start,
            EndDate: end,
        });

        const savedEvent = await event.save();

        // Push the created event id into the authenticated user's OwnedEvents
        let updatedUser = null;
        try {
            updatedUser = await User.findByIdAndUpdate(
                OwnerID,
                { $push: { OwnedEvents: savedEvent._id } },
                { new: true }
            );
        } catch (uErr) {
            console.error('Failed to add event to user OwnedEvents', uErr);
        }

        return res.status(201).json({ event: savedEvent, user: updatedUser });
    } catch (err) {
        console.error('createEvent error', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/deleteEvent/:eventId
// Body: { userId }
// Verifies that the requesting user owns the event (is listed in OwnedEvents) before deleting.
//authentication will be delt with later if needed...
router.delete('/api/deleteEvent/:Eid', /*authenticateToken,*/ async (req, res) => { 
    //const { eventId } = req.params['Eid'];
    console.log('Attempting to delete event with id:', req.params['Eid']);
    /*
    //const tokenUserId = req.user && req.user.userId;
    
    //if (!tokenUserId) return res.status(401).json({ error: 'Invalid token payload' });
    //actual implementation of jwt chatgpt more like uhhhh
    const foundToken = await StoredToken.findOne({ token: LocalStorage.getItem('token') }).exec();
    console.log('Looking for token:', LocalStorage.getItem('token'));
    console.log('Found token:', foundToken._id);
    if (foundToken.token == undefined) return res.status(401).json({ error: 'Invalid or missing token' });
    else if(foundToken.expiry < new Date()) {
        return res.status(403).json({ error: 'Token expired' });
    }
    const tokenUserId = foundToken.userId;
    */
    try {
        // Find the user
        const theUser = await fetch('http://localhost:5000/api/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
        });  

        if (!theUser) 
        {
            //console.log('User not found for id:', tokenUserId);
            return res.status(404).json({ error: 'User not found' });
        } 

        // Check ownership (compare as strings to handle ObjectId)
        //const owns = Array.isArray(theUser.OwnedEvents) && theUser.OwnedEvents.map(String).includes(String(req.params['Eid']));
        //if (!owns) return res.status(403).json({ error: 'User does not own this event' });

        // Delete the event
        //const eventInQ = await Event.findById(req.params['Eid']);
        var id = new mongoose.Types.ObjectId(req.params['Eid']);
        await User.updateOne(theUser._id, { $pull: { OwnedEvents: id } });
        console.log('now deleting:', req.params['Eid']);
        const deleted = await Event.findByIdAndDelete(req.params['Eid']);
        if (!deleted) {
            console.log('Event not found for id:', req.params['Eid']);
            return res.status(404).json({ error: 'Event not found' });
        } 

        // Remove the event id from the user's OwnedEvents array
        
        console.log('Event deleted successfully:', req.params['Eid']);
        return res.json({ ok: true ,message: 'Event deleted' });
    } catch (err) {
        console.error('deleteEvent error', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;