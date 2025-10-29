import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import Event from './Event';

type EventItem = {
    _id: string;
    Title?: string;
    title?: string;
    Start?: string;
    End?: string;
    start?: string;
    end?: string;
};

const EventList: React.FC = () => {
    const [events, setEvents] = useState<EventItem[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const fetchUrl = 'http://localhost:5000/api/events'; // adjust if your API path differs
    const load = async (signal?: AbortSignal) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(fetchUrl, { signal });
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            const mapped: EventItem[] = (Array.isArray(data) ? data : []).map((item: any) => ({
                _id: (item._id ?? '').toString(),
                // use VideoGameID as the title if no explicit title provided
                Title: item.Title ?? undefined,
                title: item.Title ?? item.VideoGameID?.toString() ?? 'Untitled',
                Start: item.StartDate ?? item.Start ?? undefined,
                start: item.StartDate ?? item.Start ?? '',
                End: item.EndDate ?? item.End ?? undefined,
                end: item.EndDate ?? item.End ?? undefined
            }));

            setEvents(mapped);
        } catch (err: any) {
            if (err && err.name === 'AbortError') return;
            setError(err?.message || 'Failed to load events');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const ac = new AbortController();
        load(ac.signal);
        return () => ac.abort();
    }, []);

    return (
        <Container fluid className="p-2">
            <Row className="mb-2 align-items-center">
                <Col>
                    <h5 className="m-0">Events</h5>
                </Col>
                <Col xs="auto">
                    <Button variant="secondary" size="sm" onClick={() => load()}>
                        Refresh
                    </Button>
                </Col>
            </Row>

            {loading && (
                <div className="d-flex justify-content-center my-4">
                    <Spinner animation="border" role="status" variant="dark" />
                </div>
            )}

            {error && <Alert variant="danger">{error}</Alert>}

            {!loading && !error && events && events.length === 0 && (
                <Alert variant="info">No events found.</Alert>
            )}

            <Row xs={1} sm={2} md={15} lg={30} className="g-2">
                {events &&
                    events.map((ev) => {
                        const title = ev.Title ?? ev.title ?? 'Untitled';
                        const start = ev.Start ?? ev.start ?? '';
                        const end = ev.End ?? ev.end ?? undefined;
                        return (
                            <Col key={ev._id}>
                                <Event title={title} start={start} end={end} />
                            </Col>
                        );
                    })}
            </Row>
        </Container>
    );
};
export default EventList;