import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Mail, Lock, UserPlus, AlertCircle, User, Phone } from 'lucide-react';
import './Login.css'; // Reusing the same CSS for consistency

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    nombre: '',
    email: '', 
    telefono: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        password: formData.password
      });

      const { token, usuario } = response.data;

      // Depending on Supabase settings, email confirmation might be required.
      // If we got a token, we log them in immediately.
      if (token) {
        localStorage.setItem('credisys_token', token);
        localStorage.setItem('credisys_user', JSON.stringify(usuario));
        navigate('/dashboard');
      } else {
        // Fallback or message to check email
        navigate('/login', { state: { message: 'Registro exitoso. Revisa tu correo o inicia sesión.' } });
      }

    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear la cuenta. Intente nuevamente.');
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
          <h1>Crea tu cuenta</h1>
          <p>Únete a CrediSys para gestionar tus préstamos</p>
        </div>

        {error && (
          <div className="error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre Completo</label>
            <div className="input-with-icon">
              <User className="input-icon" size={20} />
              <input
                type="text"
                id="nombre"
                name="nombre"
                placeholder="Juan Pérez"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>
          </div>

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
            <label htmlFor="telefono">Teléfono (Opcional)</label>
            <div className="input-with-icon">
              <Phone className="input-icon" size={20} />
              <input
                type="tel"
                id="telefono"
                name="telefono"
                placeholder="+1 234 567 8900"
                value={formData.telefono}
                onChange={handleChange}
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
                minLength="6"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={20} />
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary login-btn"
            disabled={isLoading}
            style={{ marginTop: '1rem' }}
          >
            {isLoading ? (
              <span className="flex-center">Creando cuenta...</span>
            ) : (
              <span className="flex-center">
                <UserPlus size={20} style={{ marginRight: '8px' }}/> Registrarse
              </span>
            )}
          </button>
        </form>
        
        <div className="login-footer">
          <p>¿Ya tienes una cuenta? <Link to="/login" style={{color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none'}}>Inicia Sesión aquí</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
