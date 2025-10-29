import React, { useEffect, useState } from 'react';
import { Navbar, Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const NAV_BG = '#F1C400';

const AppNavbar: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = () => setLoggedIn(Boolean(localStorage.getItem('token')));
    check();

    const onStorage = () => check();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleAuthClick = () => {
    if (loggedIn) {
      // logout
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      setLoggedIn(false);
      navigate('/login');
    } else {
      navigate('/login');
    }
  };
  const sendyoutoMANAGE = () => {
    navigate('/manage');
  }

  return (
    // fixed="top" makes the navbar stick to the top and span the full width
    <Navbar
      fixed="top"
      style={{ backgroundColor: NAV_BG, width: '100%', height: '10%', zIndex: 1030 }}
      variant="light"
      className="py-2"
    >
      <Container fluid className="d-flex align-items-center">
        <Navbar.Brand href="/" className="d-flex align-items-center">
          <img
            src={logo}
            alt="Logo"
            style={{ height: 100, marginRight: 8, objectFit: 'contain' }}
          />
        </Navbar.Brand>

        {/* right-side controls */}
        <div className="ms-auto d-flex gap-2">
          {loggedIn && (
            <Button onClick={sendyoutoMANAGE} variant="outline-dark" size="sm">
              Manage Events
            </Button>
          )}

          <Button onClick={handleAuthClick} variant="outline-dark" size="sm">
            {loggedIn ? 'Logout' : 'Login'}
          </Button>
        </div>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
