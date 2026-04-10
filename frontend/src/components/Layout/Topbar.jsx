import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Settings, Menu, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import './Topbar.css';

const Topbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const [notificaciones, setNotificaciones] = useState([]);
  
  // In a real app this would come from a Context/State
  const userStr = localStorage.getItem('credisys_user');
  const user = userStr ? JSON.parse(userStr) : { nombre: 'Usuario', rol: 'Administrador', email: 'correo@credisys.com' };

  const fetchNotificaciones = async () => {
    try {
      const response = await api.get('/notificaciones');
      setNotificaciones(response.data.notificaciones || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownToggle = () => {
    const nextState = !showNotif;
    setShowNotif(nextState);
    if (nextState) {
      fetchNotificaciones();
    }
  };

  const marcarComoLeida = async (id, yaLeida) => {
    if (yaLeida) return;
    try {
      await api.put(`/notificaciones/${id}/leer`);
      setNotificaciones(prev => 
        prev.map(n => n.id === id ? { ...n, leida: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read', error);
    }
  };

  const noLeidasCount = notificaciones.filter(n => !n.leida).length;

  const handleLogout = () => {
    localStorage.removeItem('credisys_token');
    localStorage.removeItem('credisys_user');
    window.location.href = '/login';
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <div className="topbar-search">
          {/* Search bar can go here */}
        </div>
      </div>
      
      <div className="topbar-actions">
        {/* Notifications Dropdown */}
        <div className="dropdown-container" ref={notifRef}>
          <button className="icon-btn" onClick={handleDropdownToggle}>
            <Bell size={20} />
            {noLeidasCount > 0 && <span className="badge">{noLeidasCount}</span>}
          </button>
          
          {showNotif && (
            <div className="dropdown-menu notifications-menu animate-fade-in">
              <div className="dropdown-header">
                <h3>Notificaciones</h3>
              </div>
              
              <div className="dropdown-content" style={notificaciones.length === 0 ? { padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' } : {}}>
                {notificaciones.length === 0 ? (
                  <p>No tienes notificaciones nuevas</p>
                ) : (
                  notificaciones.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`notification-item ${!notif.leida ? 'unread' : ''}`}
                      onClick={() => marcarComoLeida(notif.id, notif.leida)}
                      style={{ cursor: !notif.leida ? 'pointer' : 'default' }}
                    >
                      <div className={`notif-icon bg-${notif.tipo || 'primary'}-light`}>
                        {notif.tipo === 'success' ? <CheckCircle size={16} /> : notif.tipo === 'warning' ? <AlertTriangle size={16} /> : <Info size={16} />}
                      </div>
                      <div className="notif-text">
                        <p>{notif.mensaje}</p>
                        <span>{new Date(notif.fecha_envio).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="dropdown-footer">
                <button className="btn-text">Cerrar</button>
              </div>
            </div>
          )}
        </div>
        
        {/* User Profile Dropdown */}
        <div className="dropdown-container" ref={profileRef}>
          <div className="user-profile" onClick={() => setShowProfile(!showProfile)}>
            <div className="avatar">
              <User size={20} />
            </div>
            <div className="user-info">
              <span className="user-name">{user.nombre}</span>
              <span className="user-role">{user.rol}</span>
            </div>
          </div>
          
          {showProfile && (
            <div className="dropdown-menu profile-menu animate-fade-in">
              <div className="dropdown-header profile-header">
                <div className="avatar large">
                  <User size={30} />
                </div>
                <div className="profile-details">
                  <span className="profile-name">{user.nombre}</span>
                  <span className="profile-email">{user.email || 'correo@credisys.com'}</span>
                  <span className="profile-role badge-role">{user.rol}</span>
                </div>
              </div>
              <div className="dropdown-content">
                <button className="dropdown-item" onClick={() => navigate('/configuracion')}>
                  <Settings size={18} />
                  <span>Configuración de Cuenta</span>
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item text-danger" onClick={handleLogout}>
                  <LogOut size={18} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
