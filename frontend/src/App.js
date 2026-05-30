import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import LoginPage    from './pages/LoginPage';
import AdminPanel   from './pages/AdminPanel';
import DoctorPanel  from './pages/DoctorPanel';
import AnalystPanel from './pages/AnalystPanel';

function PrivateRoute({ children, roles }) {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/login" replace />;
  return children;
}

function RoleRedirect() {
  const role = localStorage.getItem('role');
  if (role === 'admin')   return <Navigate to="/admin"   replace />;
  if (role === 'doctor')  return <Navigate to="/doctor"  replace />;
  if (role === 'analyst') return <Navigate to="/analyst" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/"          element={<RoleRedirect />} />
          <Route path="/admin/*"   element={<PrivateRoute roles={['admin']}><AdminPanel /></PrivateRoute>} />
          <Route path="/doctor/*"  element={<PrivateRoute roles={['doctor','admin']}><DoctorPanel /></PrivateRoute>} />
          <Route path="/analyst/*" element={<PrivateRoute roles={['analyst','admin']}><AnalystPanel /></PrivateRoute>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
