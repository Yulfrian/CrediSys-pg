import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Briefcase, 
  CreditCard, 
  PieChart, 
  FileText,
  LogOut,
  X,
  Bell
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: <Home size={20} /> },
    { path: '/clientes', name: 'Clientes', icon: <Users size={20} /> },
    { path: '/prestamos', name: 'Préstamos', icon: <Briefcase size={20} /> },
    { path: '/pagos', name: 'Pagos', icon: <CreditCard size={20} /> },
    { path: '/solicitudes', name: 'Solicitudes Web', icon: <Bell size={20} /> },
    { path: '/reportes', name: 'Reportes', icon: <PieChart size={20} /> },
    { path: '/documentos', name: 'Documentos', icon: <FileText size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('credisys_token');
    localStorage.removeItem('credisys_user');
    window.location.href = '/login';
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(false)}></div>
      <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">C</div>
            <h2>CrediSys</h2>
          </div>
          <button className="close-sidebar-btn" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>
      
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
              >
                <div className="nav-icon">{item.icon}</div>
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
