import React, { useState } from 'react';
import { solicitudService } from '../../services/solicitudService';
import './SolicitudModal.css';

const SolicitudModal = ({ onClose, onSuccess }) => {
  const [monto, setMonto] = useState('');
  const [plazo, setPlazo] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monto || !plazo) {
      setError('Monto y plazo son obligatorios');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await solicitudService.crearSolicitud({
        monto: parseFloat(monto),
        plazo_meses: parseInt(plazo),
        motivo
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-solicitud" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Solicitar Nuevo Préstamo</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="solicitud-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Monto Solicitado (RD$)*</label>
            <input 
              type="number" 
              placeholder="Ej: 15000" 
              value={monto} 
              onChange={e => setMonto(e.target.value)} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Plazo Estimado (Meses)*</label>
            <input 
              type="number" 
              placeholder="Ej: 12" 
              value={plazo} 
              onChange={e => setPlazo(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Motivo del Préstamo (Opcional)</label>
            <textarea 
              placeholder="Ej: Remodelación de vivienda, gastos médicos..." 
              value={motivo} 
              onChange={e => setMotivo(e.target.value)}
              rows="3"
            ></textarea>
          </div>

          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary flex-center" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SolicitudModal;
