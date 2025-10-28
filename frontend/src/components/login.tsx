import React, { useState } from 'react';
import { Form, Button, Alert, Spinner, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
    onLogin?: (token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Login failed');
                setLoading(false);
                return;
            }

            // Expect server to return { token, userId, name }
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.userId || '');
                localStorage.setItem('userName', data.name || '');
                if (onLogin) onLogin(data.token);
                // Navigate to home or dashboard
                navigate('/');
            } else {
                setError('Login succeeded but token was not returned');
            }
        } catch (err) {
            console.error('Login error', err);
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-4">
            <Row className="justify-content-left">
                <Col xs={12} md={12} lg={12}>
                    <h3 className="mb-3">Sign in</h3>
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="loginEmail">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="loginPassword">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <div className="d-grid">
                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Spinner animation="border" size="sm" /> Signing in...
                                    </>
                                ) : (
                                    'Sign in'
                                )}
                            </Button>
                        </div>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;