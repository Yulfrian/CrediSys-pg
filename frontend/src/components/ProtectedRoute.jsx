import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem('credisys_token');
  const user = JSON.parse(localStorage.getItem('credisys_user') || '{}');

  // Si no hay token, redirigir al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si hay roles especificados y el usuario no los tiene, redirigir a una ruta por defecto según su rol
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    if (user.rol === 'cliente') {
      return <Navigate to="/mi-portal" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
