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
    const [isRegister, setIsRegister] = useState<boolean>(false);
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
            const endpoint = isRegister ? 'http://localhost:5000/api/register' : 'http://localhost:5000/api/login';
            const body = isRegister
                ? { displayname: email.split('@')[0] || '', email, password }
                : { email, password };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || (isRegister ? 'Registration failed' : 'Login failed'));
                setLoading(false);
                return;
            }

            // If registering, server may return ok/result — attempt to log in if token provided
            if (data.Token) {
                localStorage.setItem('token', data.Token);
                localStorage.setItem('userId', data.userId || '');
                localStorage.setItem('userName', data.name || '');
                if (onLogin) onLogin(data.Token);
                navigate('/');
                return;
            }

            // If registration succeeded but no token returned, inform the user
            if (isRegister) {
                navigate('/login');
                setError(null);
                alert('Registration successful. Please check your email for verification instructions.');
                navigate(`/verify/${email}`);
            } else {
                setError('Login succeeded but token was not returned');
            }
        } catch (err) {
            console.error('Auth error', err);
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-4">
            <Row className="justify-content-left">
                <Col xs={12} md={12} lg={12}>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h3 className="m-0">{isRegister ? 'Register' : 'Sign in'}</h3>
                        {/* Toggle button to flip isRegister */}
                        <Button
                            variant={isRegister ? 'outline-primary' : 'secondary'}
                            size="sm"
                            onClick={() => setIsRegister(prev => !prev)}
                        >
                            {isRegister ? 'Switch to Login' : 'Switch to Register'}
                        </Button>
                    </div>

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
                                        <Spinner animation="border" size="sm" /> {isRegister ? 'Registering...' : 'Signing in...'}
                                    </>
                                ) : isRegister ? (
                                    'Register'
                                ) : (
                                    'Sign in'
                                )}
                            </Button>
                        </div>
                        <div className="mt-3 text-center">
                            {!isRegister && (
                                <Button variant="link" onClick={() => navigate('/request-reset')}>
                                    Forgot Password?
                                </Button>
                            )}
                        </div>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;