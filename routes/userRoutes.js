app.POST('api/createEvent', async (req, res) => {
        try {
            const { title, VideoGameID, StartDate, EndDate } = req.body;
            if (!title || !VideoGameID) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            const db = client.db('COP4331Cards');
            const newEvent = {
                title,
                VideoGameID,
                StartDate: new Date(StartDate) || new Date(),
                EndDate: new Date(EndDate) || inTheFuture(StartDate, 2) || inTheFuture(new Date(), 2), //2hours in the future assuming no specified end time
            };
        }
        catch
        {
            console.error('createEvent error', err);
        }
},
function inTheFuture(date, hours) 
{
    const toAdd = hours * 60 * 60 * 1000; // hours to milliseconds
    return date.setTime(date.getTime() + toAdd );
});