import React, { useState } from 'react';
import { Form, Button, Alert, Spinner, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { buildPath } from './Path';

interface VerifyProps {
    onVerify?: () => void;
} 

const Verify: React.FC<VerifyProps> = ({ onVerify }) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const email = useParams().email;
    const navigate = useNavigate();
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); 
        if (!code) {
            setError('Please enter the verification code');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(buildPath(`api/verify-code/${email}`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userCode: code, verifyCode: localStorage.getItem('verifyCode') }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Verification failed');
                setLoading(false);
                return;
            }
            if (onVerify) onVerify();
            localStorage.remove('verifyCode');
            navigate('/login');
        } catch (err) {
            setError('An error occurred. Please try again.');
            setLoading(false);
        }
    };
    return (
        <Container>
            <Row className="justify-content-md-center">
                <Col md="6">
                    <h2 className="mt-5">Verify Your Account</h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>  
                        <Form.Group controlId="formCode" className="mb-3">
                            <Form.Label>Verification Code</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter verification code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                disabled={loading}
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Verify'}
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}

export default Verify;