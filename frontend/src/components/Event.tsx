import React from 'react';
import { Card } from 'react-bootstrap';

type EventProps = {
    title: string;
    start: string | Date;
    end?: string | Date;
    className?: string;
};

function formatDate(value: string | Date) {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return 'Invalid date';
    return d.toLocaleString();
}

const Event: React.FC<EventProps> = ({ title, start, end, className }) => {
    return (
        <Card
            className={`bg-black text-white ${className || ''}`}
            style={{ borderRadius: 8, width: '100%' }}
        >
            <Card.Body className="p-2">
                <Card.Title style={{ fontSize: 16, fontWeight: 600 }}>{title}</Card.Title>
                <Card.Text style={{ fontSize: 13, marginBottom: 0 }}>
                    <div>Start: {formatDate(start)}</div>
                    {end && <div>End: {formatDate(end)}</div>}
                </Card.Text>
            </Card.Body>
        </Card>
    );
};

export default Event;