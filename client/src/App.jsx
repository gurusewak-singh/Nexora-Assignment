// client/src/App.jsx
import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LiveRoomPage from './pages/LiveRoomPage'; // Add this import
import { AuthContext } from './context/AuthContext';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>; // Or a spinner component
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/session/:sessionId" element={<PrivateRoute><LiveRoomPage /></PrivateRoute>} /> {/* Add this route */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;