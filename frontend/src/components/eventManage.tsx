
import React, { useState } from 'react';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';

interface Props {
  onCreated?: (event: any) => void; // optional callback so parent can refresh list
}

const EventManage: React.FC<Props> = ({ onCreated }) => {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState(''); // use input type=datetime-local value
  const [end, setEnd] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title ) {
      setError('Title is required.');
      return;
    }

    const token = localStorage.getItem('token');
    //console.debug(token);
    if (token == undefined) {
      setError('You must be logged in to create events.');
      return;
    }
    
    setSubmitting(true);

    try {
      // create event
      const res_user = await fetch('http://localhost:5000/api/me', {
        method: 'POST',
        body: JSON.stringify({
          Token : token
        })
        
      });
      const st_user = await res_user.json();    
      const createRes = await fetch('http://localhost:5000/api/createEvent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          VideoGameID: title,
          StartDate: start,
          EndDate: end || null,
          OwnerID: st_user._id
        })
      });

      if (!createRes.ok) {
        const body = await createRes.json();
        throw new Error((body && (body as any).error) || `Create failed (${createRes.status})`);
      }

      const created = await createRes.json();
      if ((created as any).__invalidJson) {
        throw new Error('Invalid response from server when creating event');
      }

      //const eventId = (created && ((created as any)._id || (created as any).id))?.toString();
      //if (!eventId) {
      //  throw new Error('Server did not return created event id');
      //}

      // add event id to user's OwnedEvents array
      // try recommended route(s) — adjust to your backend if different
      

      setSuccess('Event created and added to your account.');
      setTitle('');
      setStart('');
      setEnd('');
      onCreated?.(created);
    } catch (err: any) {
      console.error('create event error', err);
      setError(err?.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>Create Event</Card.Title>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-2" controlId="evTitle">
            <Form.Label>Title</Form.Label>
            <Form.Control
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
            />
          </Form.Group>

          <Form.Group className="mb-2" controlId="evStart">
            <Form.Label>Start</Form.Label>
            <Form.Control
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              //required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="evEnd">
            <Form.Label>End (optional)</Form.Label>
            <Form.Control
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </Form.Group>

          <div className="d-flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? <><Spinner animation="border" size="sm" /> Creating...</> : 'Create Event'}
            </Button>

            <Button variant="secondary" onClick={() => { setTitle(''); setStart(''); setEnd(''); }} disabled={submitting}>
              Reset
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default EventManage;