import React from 'react';
import { Container } from 'react-bootstrap';
import AppNavbar from '../components/navbar';
import EventList from '../components/eventList';

const Homepage: React.FC = () => {
    return (
        <>
            <AppNavbar />
            {/* ensure main content is not hidden under the fixed navbar */}
            <main style={{ paddingTop: '5rem' }}>
                <Container fluid className="p-3">
                    <EventList />
                </Container>
            </main>
        </>
    );
};

export default Homepage;