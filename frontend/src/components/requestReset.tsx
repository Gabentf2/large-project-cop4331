import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
const RequestReset: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const navigate = useNavigate();
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (!email) {
            setError('Please enter your email');
            return;
        }
        try {
            const res = await fetch('http://localhost:5000/api/request-password-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Request failed');
                return;
            }
            setSuccess('If an account with that email exists, a reset code has been sent.');
            setTimeout(() => navigate('/reset-password'), 3000);
        } catch (err) {
            setError('An error occurred. Please try again.');
        }
    };
    return (
        <>
            <Container>
                <h2 className="mt-5">Request Password Reset</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="formEmail" className="mb-3">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </Form.Group>   
                    <Button variant="primary" type="submit">
                        Request Reset
                    </Button>
                </Form>
            </Container>
        </>
    );
}
export default RequestReset;