import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import VerifyEmail from './pages/VerifyEmail.tsx';
import Dashboard from './pages/Dashboard.tsx';
import StaffDashboard from './pages/StaffDashboard.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';

function PrivateRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) return <Navigate to="/login" />;
  if (role && user.role !== role) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" />;
    if (user.role === 'staff') return <Navigate to="/staff/dashboard" />;
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute role="student">
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/staff/dashboard" 
          element={
            <PrivateRoute role="staff">
              <StaffDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <PrivateRoute role="admin">
              <AdminDashboard />
            </PrivateRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
