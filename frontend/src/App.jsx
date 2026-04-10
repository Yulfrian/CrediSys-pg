import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages Admin
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Prestamos from './pages/Prestamos';
import Pagos from './pages/Pagos';
import Reportes from './pages/Reportes';
import Documentos from './pages/Documentos';
import Configuracion from './pages/Configuracion';
import Solicitudes from './pages/Solicitudes';

// Pages Cliente
import ClientDashboard from './pages/ClientDashboard';

// Layouts & Auth
import MainLayout from './components/Layout/MainLayout';
import ClientLayout from './components/Layout/ClientLayout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes - Administrador */}
        <Route element={<ProtectedRoute allowedRoles={['administrador']} />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="prestamos" element={<Prestamos />} />
            <Route path="pagos" element={<Pagos />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="documentos" element={<Documentos />} />
            <Route path="solicitudes" element={<Solicitudes />} />
            <Route path="configuracion" element={<Configuracion />} />
          </Route>
        </Route>

        {/* Protected Routes - Cliente Común */}
        <Route element={<ProtectedRoute allowedRoles={['cliente']} />}>
          <Route path="/mi-portal" element={<ClientLayout />}>
            <Route index element={<ClientDashboard />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
