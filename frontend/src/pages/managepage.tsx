import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert, Modal, Button } from 'react-bootstrap';
import AppNavbar from '../components/navbar';
import Event from '../components/Event';
import { useNavigate } from 'react-router-dom';
import { buildPath } from '../components/Path';

type EventItem = {
  _id: string;
  Title?: string;
  Start?: string;
  End?: string;
  OwnerId?: string;
};
//
const ManagePage: React.FC = () => {
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<EventItem | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const ac = new AbortController();
    const load = async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Not logged in');
          setEvents([]);
          setLoading(false);
          return;
        }

        // fetch current user via /api/me
      const meRes = await fetch(buildPath('api/me'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Token: token
          //userID: LocalStorage.getItem
        }),
      });
        
        if (!meRes.ok) {
          if (meRes.status === 401) {
            const body = await meRes.json().catch(() => ({}));
            setError(body.error || 'Not authorized / token expired');
            setEvents([]);
            setLoading(false);
            return;
          }
          throw new Error(`Failed to load user (${meRes.status})`);
        }

        const userData = await meRes.json();
        const owned: string[] = Array.isArray(userData.OwnedEvents)
          ? userData.OwnedEvents.map(String)
          : [];

        // fetch all events
        const eventsRes = await fetch(buildPath('api/events'), { signal });
        if (!eventsRes.ok) throw new Error('Failed to load events');
        const all = await eventsRes.json();

        const mapped: EventItem[] = (Array.isArray(all) ? all : []).map((item: any) => ({
          _id: (item._id ).toString(),
          Title: item.VideoGameID ?? undefined,
          Start: item.StartDate ?? item.Start ?? item.start,
          End: item.EndDate ?? item.End ?? item.end,
          OwnerId: item.OwnerId ?? item.owner ?? item.Owner ?? undefined
        }));

        const filtered = mapped.filter(ev => {
          if (owned.length > 0) {
            return owned.includes(ev._id) || (ev.OwnerId && owned.includes(ev.OwnerId));
          }
          return false;
        });

        setEvents(filtered);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error(err);
        setError(err?.message || 'Failed to load managed events');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    load(ac.signal);
    return () => ac.abort();
  }, []);

  const handleSelect = (ev: EventItem) => {
    setSelected(ev);
    setDeleteError(null);
    setShowConfirm(true);
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    setDeleteError(null);
    if(!selected._id) {
      setDeleteError('Selected event has no valid ID.');
      setDeleting(false);
      return;
    }
    const token = localStorage.getItem('token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const fetchurl = buildPath(`api/deleteEvent/${token}/${selected._id}`);
    //fetchurl.set('z', selected._id);
    try {
      // try DELETE /api/events/:id first
      let res = await fetch(fetchurl, {
        method: 'DELETE',
        headers
      });

      // fallback to user route if DELETE failed
      //if (!res.ok) {
      //  res = await fetch('http://localhost:5000/api/deleteEvent', {
      //    method: 'POST',
      //    headers,
      //    body: JSON.stringify({ eventId: selected._id })
      //  });
      //}

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Delete failed (${res.status})`);
      }

      // remove from UI
      setEvents(prev => (prev ? prev.filter(e => e._id !== selected._id) : prev));
      setShowConfirm(false);
      setSelected(null);
    } catch (err: any) {
      console.error('delete event error', err);
      setDeleteError(err?.message || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <AppNavbar />
      <main style={{ paddingTop: '5rem' }}>
        <Container fluid className="p-3">
          <h5 className="mb-3">My Events</h5>

          {loading && (
            <div className="d-flex justify-content-center my-4">
              <Spinner animation="border" role="status" />
            </div>
          )}

          {error && <Alert variant="danger">{error}</Alert>}

          {!loading && !error && events && events.length === 0 && (
            <Alert variant="info">You have no events.</Alert>
          )}

          <Row xs={1} sm={2} md={3} lg={4} className="g-2">
            {events && events.map(ev => (
              <Col key={ev._id} onClick={() => handleSelect(ev)} style={{ cursor: 'pointer' }}>
                <Event title={ev.Title ?? 'Untitled'} start={ev.Start ?? ''} end={ev.End} />
              </Col>
            ))}
          </Row>
        </Container>

        <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Delete event?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selected ? (
              <>
                <p>Delete the event "<strong>{selected._id}</strong>"?</p>
                {deleteError && <Alert variant="danger">{deleteError}</Alert>}
              </>
            ) : (
              <p>No event selected.</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConfirm(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? <><Spinner animation="border" size="sm" /> Deleting...</> : 'Delete'}
            </Button>
          </Modal.Footer>
        </Modal>
      </main>
        <div className="rounded-circle bg-dark text-white text-center p-2 fixed-bottom" style={{ opacity: 1, margin: 10, width: 100, height: 100, right: 0, bottom: 0 }}>   
            <button onClick={() => navigate('/addEvent') /*null*/ } style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem' }}>
              +
            </button>
      </div>
    </>
  );
};

export default ManagePage;