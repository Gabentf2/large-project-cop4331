import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/homepage';
import LoginPage from './pages/loginpage';
import ManagePage from './pages/managepage';
import EventAddPage from './pages/addEvent';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/manage" element={<ManagePage />} />
        <Route path="/addEvent" element={<EventAddPage />} />
      </Routes>
    </BrowserRouter>
    
  );
}

export default App;
