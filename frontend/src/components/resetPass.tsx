import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { buildPath } from './Path';

const ResetPass: React.FC = () => { 
    const [nPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetCode, setResetCode] = useState(''); 

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const navigate = useNavigate();
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if(resetCode.length === 0){
            setError('Please enter the reset code');
            return;
        }
        if (!nPassword || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }
        if (nPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        try {
            const res = await fetch(buildPath('api/reset-passwords'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: resetCode, newPassword: nPassword, email: localStorage.getItem('userEmail'), serverCode: localStorage.getItem('resetCode') }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Password reset failed');
                return;
            }
            setSuccess('Password reset successful. You can now log in with your new password.');
            localStorage.removeItem('resetCode');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError('An error occurred. Please try again.');
        }
    };
    return (
        <>
            <Container>
                <h2 className="mt-5">Reset Your Password</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="formResetCode" className="mb-3">
                        <Form.Label>Reset Code</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter reset code"
                            value={resetCode}
                            onChange={(e) => setResetCode(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group controlId="formNewPassword" className="mb-3">
                        <Form.Label>New Password</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Enter new password"
                            value={nPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group controlId="formConfirmPassword" className="mb-3">   
                        <Form.Label>Confirm New Password</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </Form.Group>
                    <Button variant="primary" type="submit">
                        Reset Password  
                    </Button>
                </Form>
            </Container>
        </>
    );
}
export default ResetPass;