import React, { useState, useEffect } from 'react';
import { Settings, Save, User, Mail, Phone, MapPin, AlertCircle, CheckCircle, Shield, Key } from 'lucide-react';
import api from '../services/api';
import './Configuracion.css';

const Configuracion = () => {
  const [activeTab, setActiveTab] = useState('datos');
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    rol: ''
  });
  const [passwordData, setPasswordData] = useState({
    passwordActual: '',
    nuevaPassword: '',
    confirmarPassword: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/usuarios/perfil');
        if (res.data && res.data.perfil) {
          const perfil = res.data.perfil;
          setFormData({
            nombre: perfil.nombre || '',
            email: perfil.email || '',
            telefono: perfil.telefono || '',
            direccion: perfil.direccion || '',
            rol: perfil.rol || 'cliente'
          });
        }
      } catch (error) {
        setMensaje({ texto: 'Error al cargar el perfil', tipo: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPerfil();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSaveDatos = async () => {
    try {
      setIsSaving(true);
      setMensaje({ texto: '', tipo: '' });
      await api.put('/usuarios/perfil', formData);
      setMensaje({ texto: 'Perfil actualizado con éxito', tipo: 'success' });
      
      const userDataStr = localStorage.getItem('credisys_user');
      if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          userData.nombre = formData.nombre;
          localStorage.setItem('credisys_user', JSON.stringify(userData));
      }
    } catch (error) {
      setMensaje({ texto: error.response?.data?.mensaje || 'Error al actualizar', tipo: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (passwordData.nuevaPassword !== passwordData.confirmarPassword) {
      setMensaje({ texto: 'Las contraseñas no coinciden', tipo: 'error' });
      return;
    }
    if (passwordData.nuevaPassword.length < 6) {
      setMensaje({ texto: 'La nueva contraseña debe tener al menos 6 caracteres', tipo: 'error' });
      return;
    }
    try {
      setIsSaving(true);
      setMensaje({ texto: '', tipo: '' });
      await api.put('/usuarios/password', {
         passwordActual: passwordData.passwordActual,
         nuevaPassword: passwordData.nuevaPassword
      });
      setMensaje({ texto: 'Contraseña actualizada con éxito', tipo: 'success' });
      setPasswordData({ passwordActual: '', nuevaPassword: '', confirmarPassword: '' });
    } catch (error) {
      setMensaje({ texto: error.response?.data?.mensaje || 'Error al cambiar contraseña', tipo: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="configuracion-container">Cargando perfil...</div>;
  }

  return (
    <div className="configuracion-container">
      <header className="page-header mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="text-primary" /> Configuración de Cuenta
          </h1>
          <p className="text-muted">Administra los detalles personales y de seguridad de tu cuenta.</p>
        </div>
      </header>

      <div className="config-tabs">
        <button 
          className={`config-tab ${activeTab === 'datos' ? 'active' : ''}`}
          onClick={() => { setActiveTab('datos'); setMensaje({texto:'', tipo:''}); }}
        >
          <User size={18} /> Datos Personales
        </button>
        <button 
          className={`config-tab ${activeTab === 'seguridad' ? 'active' : ''}`}
          onClick={() => { setActiveTab('seguridad'); setMensaje({texto:'', tipo:''}); }}
        >
          <Shield size={18} /> Seguridad
        </button>
      </div>

      <div className="config-content">
        <div className="config-card glass">
          
          {mensaje.texto && (
            <div className={`config-alert ${mensaje.tipo}`}>
              {mensaje.tipo === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
              <span>{mensaje.texto}</span>
            </div>
          )}

          {activeTab === 'datos' && (
            <div>
              <div className="config-form-grid">
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <div className="input-with-icon">
                    <User size={18} />
                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="config-input" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Correo Electrónico (No modificable)</label>
                  <div className="input-with-icon">
                    <Mail size={18} />
                    <input type="email" name="email" value={formData.email} disabled className="config-input" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Teléfono</label>
                  <div className="input-with-icon">
                    <Phone size={18} />
                    <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} className="config-input" />
                  </div>
                </div>

                {formData.rol === 'cliente' && (
                  <div className="form-group">
                    <label>Dirección Física</label>
                    <div className="input-with-icon">
                      <MapPin size={18} />
                      <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="config-input" />
                    </div>
                  </div>
                )}
              </div>

              <div className="config-actions">
                <button className="btn-primary flex-center" onClick={handleSaveDatos} disabled={isSaving}>
                  <Save size={20} style={{ marginRight: '8px' }} />
                  {isSaving ? 'Guardando...' : 'Guardar Datos'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'seguridad' && (
            <div>
              <div className="config-form-grid">
                <div className="form-group">
                  <label>Contraseña Actual</label>
                  <div className="input-with-icon">
                    <Key size={18} />
                    <input type="password" name="passwordActual" value={passwordData.passwordActual} onChange={handlePasswordChange} className="config-input" placeholder="Tu contraseña actual" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Nueva Contraseña</label>
                  <div className="input-with-icon">
                    <Key size={18} />
                    <input type="password" name="nuevaPassword" value={passwordData.nuevaPassword} onChange={handlePasswordChange} className="config-input" placeholder="Mínimo 6 caracteres" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirmar Nueva Contraseña</label>
                  <div className="input-with-icon">
                    <Key size={18} />
                    <input type="password" name="confirmarPassword" value={passwordData.confirmarPassword} onChange={handlePasswordChange} className="config-input" placeholder="Mínimo 6 caracteres" />
                  </div>
                </div>
              </div>

              <div className="config-actions">
                <button className="btn-primary flex-center" onClick={handleSavePassword} disabled={isSaving}>
                  <Shield size={20} style={{ marginRight: '8px' }} />
                  {isSaving ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Configuracion;
