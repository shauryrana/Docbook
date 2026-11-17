import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorsList from './pages/patient/DoctorsList';
import BookAppointment from './pages/patient/BookAppointment';
import MyAppointments from './pages/patient/MyAppointments';
import ManageSlots from './pages/doctor/ManageSlots';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import ManageDoctors from './pages/admin/ManageDoctors';
import AdminAppointments from './pages/admin/AdminAppointments';

// Default Home redirect based on role
const HomeRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <DoctorsList />;
  if (user?.role === 'doctor') return <Navigate to="/doctor/appointments" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/appointments" replace />;
  return <DoctorsList />;
};

function App() {
  return (
    <div className="app-layout">
      {/* Background Ambient Glow & Floating Medical Orbs Animation */}
      <div className="bg-animation-container">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="bg-pattern"></div>
      </div>

      <Navbar />

      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/doctors" element={<DoctorsList />} />

          {/* Patient Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
            <Route path="/book" element={<BookAppointment />} />
            <Route path="/book/:doctorId" element={<BookAppointment />} />
            <Route path="/my-appointments" element={<MyAppointments />} />
          </Route>

          {/* Doctor Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
            <Route path="/doctor/slots" element={<ManageSlots />} />
            <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/doctors" element={<ManageDoctors />} />
            <Route path="/admin/appointments" element={<AdminAppointments />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
