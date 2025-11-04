import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/homepage';
import LoginPage from './pages/loginpage';
import ManagePage from './pages/managepage';
import EventAddPage from './pages/addEvent';
import VerifyPage from './pages/verifypage';
import RequestResetPage from './pages/request-reset';
import ResetPage from './pages/reset';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/manage" element={<ManagePage />} />
        <Route path="/addEvent" element={<EventAddPage />} />
        <Route path="/verify/:email" element={<VerifyPage />} />
        <Route path="/request-reset" element={<RequestResetPage />} />
        <Route path="/reset-password" element={<ResetPage />} />
      </Routes>
    </BrowserRouter>
    
  );
}

export default App;
