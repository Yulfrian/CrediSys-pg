import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', formData);
      const { token, usuario } = response.data;

      // Save to localStorage
      localStorage.setItem('credisys_token', token);
      localStorage.setItem('credisys_user', JSON.stringify(usuario));

      // Redirect depending on role
      if (usuario.rol === 'cliente') {
        navigate('/mi-portal');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass">
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon-large">C</div>
          </div>
          <h1>Bienvenido a CrediSys</h1>
          <p>El sistema de control para tu negocio de préstamos</p>
        </div>

        {error && (
          <div className="error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                id="email"
                name="email"
                placeholder="usuario@correo.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={20} />
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary login-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex-center">Cargando...</span>
            ) : (
              <span className="flex-center">
                <LogIn size={20} style={{ marginRight: '8px' }}/> Ingresar
              </span>
            )}
          </button>
        </form>
        
        <div className="login-footer">
          <p>¿No tienes una cuenta? <Link to="/register" style={{color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none', marginLeft: '4px'}}>Regístrate aquí</Link></p>

        </div>
      </div>
    </div>
  );
};

export default Login;
