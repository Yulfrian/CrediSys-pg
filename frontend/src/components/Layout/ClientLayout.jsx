import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { LogOut, User, Bell, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import './ClientLayout.css';

const ClientLayout = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('credisys_token');
  const user = JSON.parse(localStorage.getItem('credisys_user') || '{}');

  const [notificaciones, setNotificaciones] = useState([]);
  const [showNoti, setShowNoti] = useState(false);

  useEffect(() => {
    if (token) {
      cargarNotificaciones();
    }
  }, [token]);

  const cargarNotificaciones = async () => {
    try {
      const res = await api.get('/notificaciones');
      setNotificaciones(res.data.notificaciones || []);
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    }
  };

  const marcarComoLeida = async (id) => {
    try {
      await api.put(`/notificaciones/${id}/leer`);
      setNotificaciones(notificaciones.map(n => n.id === id ? { ...n, leida: true } : n));
    } catch (error) {
      console.error("Error al marcar leída:", error);
    }
  };

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('credisys_token');
    localStorage.removeItem('credisys_user');
    navigate('/login');
  };

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="client-layout">
      {/* Topbar Simplificado */}
      <header className="client-topbar">
        <div className="client-brand">
          <div className="client-logo-icon">C</div>
          <span className="client-brand-name">CrediSys</span>
        </div>
        
        <div className="client-topbar-actions">
          
          <div className="noti-container">
            <button className="icon-btn-client" onClick={() => setShowNoti(!showNoti)}>
              <Bell size={20} />
              {noLeidas > 0 && <span className="noti-badge">{noLeidas}</span>}
            </button>

            {showNoti && (
              <div className="noti-dropdown shadow-lg">
                <div className="noti-header">
                  <h4>Notificaciones</h4>
                </div>
                <div className="noti-body">
                  {notificaciones.length === 0 ? (
                    <div className="noti-empty">No tienes notificaciones</div>
                  ) : (
                    notificaciones.map(noti => (
                      <div key={noti.id} className={`noti-item ${!noti.leida ? 'noti-unread' : ''}`} onClick={() => !noti.leida && marcarComoLeida(noti.id)}>
                        <div className="noti-content">
                          <p>{noti.mensaje}</p>
                          <span className="noti-time">{new Date(noti.fecha_envio).toLocaleDateString()}</span>
                        </div>
                        {!noti.leida && <span className="noti-dot"></span>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="client-profile">
            <div className="profile-icon">
              <User size={20} />
            </div>
            <div className="profile-info-client">
              <span className="profile-name-client">{user.nombre || 'Cliente'}</span>
              <span className="profile-role-client">Mi Portal</span>
            </div>
          </div>
          
          <button className="client-logout-explicit" onClick={handleLogout} title="Cerrar Sesión">
            <LogOut size={18} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="client-main-content animate-fade-in">
        <div className="client-content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ClientLayout;
