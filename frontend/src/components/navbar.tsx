import React from 'react';
import { Navbar } from 'react-bootstrap';

const NAV_BG = '#F1C400';

const AppNavbar: React.FC = () => (
  // fixed="top" makes the navbar stick to the top and span the full width
  <Navbar fixed="top" style={{ backgroundColor: NAV_BG, width: '100%', height: '15%', zIndex: 1030 }} variant="light" className="py-2" />
);

export default AppNavbar;
