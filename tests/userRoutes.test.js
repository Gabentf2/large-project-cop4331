// Jest + Supertest unit tests for create/delete event routes
const request = require('supertest');
const express = require('express');

// Mock the authentication middleware so tests don't need real JWTs.
jest.mock('../middleware/auth', () => jest.fn((req, res, next) => {
  // Simulate an authenticated user with id 'user123'
  req.user = { userId: 'user123' };
  next();
}));

// Mock Event model: constructor returns an object with a save() that resolves
// to the created event object. Provide a static findByIdAndDelete mock.
jest.mock('../models/event', () => {
  const Event = function (data) {
    this.save = () => Promise.resolve(Object.assign({ _id: 'event123' }, data));
  };
  Event.findByIdAndDelete = jest.fn(() => Promise.resolve({ _id: 'event123' }));
  return Event;
});

// Mock User model with the methods used by the routes.
const UserMock = {
  findByIdAndUpdate: jest.fn(() => Promise.resolve({ _id: 'user123', OwnedEvents: ['event123'] })),
  findById: jest.fn(() => Promise.resolve({ _id: 'user123', OwnedEvents: ['event123'] })),
};
jest.mock('../models/user', () => UserMock);

describe('userRoutes (create/delete)', () => {
  let app;
  beforeEach(() => {
    // Clear mock call history
    jest.clearAllMocks();

    // Require the router after mocks are in place
    const userRoutes = require('../routes/userRoutes');

    app = express();
    app.use(express.json());
    app.use('/', userRoutes);
  });

  test('POST /api/createEvent creates an event and pushes id into user OwnedEvents', async () => {
    // Arrange: ensure User.findByIdAndUpdate will resolve as expected
    UserMock.findByIdAndUpdate.mockResolvedValueOnce({ _id: 'user123', OwnedEvents: ['event123'] });

    // Act
    const res = await request(app)
      .post('/api/createEvent')
      .send({ title: 'Test Event', VideoGameID: 'VG1' });

    // Assert
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('event');
    expect(res.body.event).toHaveProperty('_id', 'event123');
    expect(UserMock.findByIdAndUpdate).toHaveBeenCalledTimes(1);
    const pushedId = res.body.event._id;
    expect(UserMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'user123',
      { $push: { OwnedEvents: pushedId } },
      { new: true }
    );
  });

  test('DELETE /api/deleteEvent/:eventId deletes the event when user owns it', async () => {
    // Arrange: user owns the event and Event.findByIdAndDelete will delete it
    UserMock.findById.mockResolvedValueOnce({ _id: 'user123', OwnedEvents: ['event123'] });
    const Event = require('../models/event');
    Event.findByIdAndDelete.mockResolvedValueOnce({ _id: 'event123' });
    UserMock.findByIdAndUpdate.mockResolvedValueOnce({ _id: 'user123', OwnedEvents: [] });

    // Act
    const res = await request(app).delete('/api/deleteEvent/event123').send();

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Event deleted');
    expect(UserMock.findById).toHaveBeenCalledWith('user123');
    expect(Event.findByIdAndDelete).toHaveBeenCalledWith('event123');
    expect(UserMock.findByIdAndUpdate).toHaveBeenCalledWith('user123', { $pull: { OwnedEvents: 'event123' } });
  });
});
