import React, { useState, useEffect } from 'react';
import { solicitudService } from '../services/solicitudService';
import { Check, X, FileText } from 'lucide-react';
import './Prestamos.css'; // Podemos reusar el CSS tabular

const Solicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal de aprobación
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [aprobacionData, setAprobacionData] = useState({
    tasa_interes: '',
    fecha_inicio: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      const resp = await solicitudService.obtenerTodasLasSolicitudes();
      setSolicitudes(resp.solicitudes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(valor);
  };

  const handleOpenApproveModal = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setAprobacionData({
      tasa_interes: '',
      fecha_inicio: new Date().toISOString().split('T')[0]
    });
    setShowApproveModal(true);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await solicitudService.cambiarEstado(
        solicitudSeleccionada.id, 
        'aprobada', 
        aprobacionData.tasa_interes, 
        aprobacionData.fecha_inicio
      );
      alert('¡El préstamo ha sido generado y la solicitud fue aprobada!');
      setShowApproveModal(false);
      fetchSolicitudes();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.mensaje || 'Error al aprobar solicitud y generar préstamo.');
      setLoading(false);
    }
  };

  const handleEstado = async (id, estadoAConvertir) => {
    if (estadoAConvertir === 'rechazada') {
       const confirm = window.confirm(`¿Estás seguro de rechazar esta solicitud?`);
       if(!confirm) return;
       try {
         setLoading(true);
         await solicitudService.cambiarEstado(id, estadoAConvertir);
         alert(`La solicitud ha sido rechazada.`);
         fetchSolicitudes();
       } catch (err) {
         console.error(err);
         alert(err.response?.data?.mensaje || 'Error cambiando estado.');
         setLoading(false);
       }
    }
  };

  return (
    <div className="prestamos-container">
      <div className="header-actions">
        <div>
          <h1 className="dashboard-title">Solicitudes Web</h1>
          <p className="dashboard-subtitle">Créditos solicitados directamente por los clientes desde su portal.</p>
        </div>
      </div>

      <div className="table-container fade-in">
        {loading ? (
          <div className="loading-state">Buscando solicitudes...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Monto Pedido</th>
                <th>Plazo</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.length > 0 ? (
                solicitudes.map(s => (
                  <tr key={s.id}>
                    <td>#{s.id}</td>
                    <td>{s.clientes?.nombre} {s.clientes?.apellido} <br/><small>{s.clientes?.dni}</small></td>
                    <td>{new Date(s.fecha_solicitud).toLocaleDateString()}</td>
                    <td className="amount">{formatearMoneda(s.monto)}</td>
                    <td>{s.plazo_meses} meses</td>
                    <td style={{maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={s.motivo}>
                      {s.motivo || 'N/A'}
                    </td>
                    <td>
                      <span className={`badge badge-${s.estado.toLowerCase()}`}>
                        {s.estado}
                      </span>
                    </td>
                    <td>
                      {s.estado === 'pendiente' ? (
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                          <button onClick={() => handleOpenApproveModal(s)} style={{background: '#10B981', color: 'white', padding: '0.4rem', borderRadius: '4px', border: 'none', cursor: 'pointer'}} title="Aprobar"><Check size={18}/></button>
                          <button onClick={() => handleEstado(s.id, 'rechazada')} style={{background: '#EF4444', color: 'white', padding: '0.4rem', borderRadius: '4px', border: 'none', cursor: 'pointer'}} title="Rechazar"><X size={18}/></button>
                        </div>
                      ) : (
                        <span style={{color: '#94a3b8', fontSize: '0.8rem'}}>Procesada</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-state" style={{padding: '3rem', textAlign: 'center'}}>No hay solicitudes nuevas en bandeja.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showApproveModal && solicitudSeleccionada && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="modal-content" style={{maxWidth: '500px'}} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Aprobar Préstamo #{solicitudSeleccionada.id}</h2>
              <button className="close-btn" onClick={() => setShowApproveModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleApproveSubmit} style={{padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem'}}>
               <p style={{color: 'var(--color-text-main)', fontSize: '0.95rem'}}>
                  Inicia la emisión del crédito autorizando los parámetros comerciales faltantes.
               </p>
               <div style={{backgroundColor: 'var(--color-surface-soft)', padding: '1rem', borderRadius: 'var(--radius-md)'}}>
                  <div style={{fontSize: '0.85rem', color: 'var(--color-text-muted)'}}>Monto Aprobado</div>
                  <div style={{fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-text-title)'}}>{formatearMoneda(solicitudSeleccionada.monto)}</div>
                  <div style={{fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem'}}>Plazo Estimado</div>
                  <div style={{fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-text-main)'}}>{solicitudSeleccionada.plazo_meses} meses</div>
               </div>

               <div className="form-group">
                  <label>Tasa de Interés Mensual (%) *</label>
                  <div className="input-with-suffix">
                    <input autoFocus type="number" step="0.01" value={aprobacionData.tasa_interes} onChange={e => setAprobacionData({...aprobacionData, tasa_interes: e.target.value})} placeholder="Ej: 5" required />
                    <span className="suffix">%</span>
                  </div>
               </div>
               <div className="form-group">
                  <label>Fecha de Inicio / Desembolso *</label>
                  <input type="date" className="form-control" value={aprobacionData.fecha_inicio} onChange={e => setAprobacionData({...aprobacionData, fecha_inicio: e.target.value})} required />
               </div>
               <div className="modal-actions" style={{padding: '1rem 0 0 0', marginTop: '0.5rem', borderTop: '1px solid var(--color-border)', justifyContent: 'flex-end'}}>
                 <button type="button" className="btn-secondary" onClick={() => setShowApproveModal(false)}>Cancelar</button>
                 <button type="submit" className="btn-primary pulse" style={{backgroundColor: '#10B981'}}>Emitir Préstamo</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Solicitudes;
