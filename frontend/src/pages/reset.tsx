import React from 'react';
import { Container } from 'react-bootstrap';
import AppNavbar from '../components/navbar';
import Login from '../components/resetPass';

const LoginPage: React.FC = () => {
  return (
    <>
      <AppNavbar />
      {/* ensure main content is not hidden under the fixed navbar */}
      <main style={{ paddingTop: '5rem' }}>
        <Container className="p-3 d-flex justify-content-left">
          <Login />
        </Container>
      </main>
    </>
  );
};

export default LoginPage;