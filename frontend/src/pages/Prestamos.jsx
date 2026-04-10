import React, { useState, useEffect } from 'react';
import { prestamoService } from '../services/prestamoService';
import { clienteService } from '../services/clienteService';
import { cuotaService } from '../services/cuotaService';
import { Calculator, Calendar } from 'lucide-react';
import './Prestamos.css';

const Prestamos = () => {
  const [prestamos, setPrestamos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    cliente_id: '',
    monto: '',
    tasa_interes: '', // Ingresado como %, p.ej: 5
    plazo_meses: '',
    fecha_inicio: new Date().toISOString().split('T')[0] // Hoy por defecto
  });

  // Simulator states
  const [simulacion, setSimulacion] = useState({ cuota: 0, totalPagar: 0, interesTotal: 0 });

  // Amortization Modal states
  const [showAmortizacionModal, setShowAmortizacionModal] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState(null);
  const [cuotasAmortizacion, setCuotasAmortizacion] = useState([]);
  const [loadingAmortizacion, setLoadingAmortizacion] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Update simulator whenever form data changes
  useEffect(() => {
    calcularSimulacion();
  }, [formData.monto, formData.tasa_interes, formData.plazo_meses]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prestamosData, clientesData] = await Promise.all([
        prestamoService.obtenerPrestamos(),
        clienteService.obtenerClientes()
      ]);
      setPrestamos(prestamosData.prestamos || []);
      setClientes(clientesData.clientes || []);
      setError(null);
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError("No se pudieron cargar los datos. Por favor intente más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const calcularSimulacion = () => {
    const P = parseFloat(formData.monto);
    const n = parseInt(formData.plazo_meses);
    const tasaPorcentaje = parseFloat(formData.tasa_interes);

    if (!P || !n || P <= 0 || n <= 0) {
      setSimulacion({ cuota: 0, totalPagar: 0, interesTotal: 0 });
      return;
    }

    let cuotaMensual = 0;
    let total = 0;
    let interes = 0;

    if (!tasaPorcentaje || tasaPorcentaje === 0) {
      cuotaMensual = P / n;
      total = P;
    } else {
      const i = tasaPorcentaje / 100; // Convertir % a decimal
      const factor = Math.pow(1 + i, n);
      cuotaMensual = P * (i * factor) / (factor - 1);
      total = cuotaMensual * n;
      interes = total - P;
    }

    setSimulacion({
      cuota: isNaN(cuotaMensual) ? 0 : cuotaMensual,
      totalPagar: isNaN(total) ? 0 : total,
      interesTotal: isNaN(interes) ? 0 : interes
    });
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(valor);
  };

  const handleOpenModal = () => {
    setFormData({
      cliente_id: clientes.length > 0 ? clientes[0].id : '',
      monto: '',
      tasa_interes: '',
      plazo_meses: '',
      fecha_inicio: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.cliente_id) {
        alert("Debe seleccionar un cliente valido.");
        return;
      }

      // Preparar data para el backend (convertir % a decimal interno)
      const dataToSubmit = {
        ...formData,
        cliente_id: parseInt(formData.cliente_id),
        monto: parseFloat(formData.monto),
        plazo_meses: parseInt(formData.plazo_meses),
        tasa_interes: parseFloat(formData.tasa_interes) / 100 
      };

      await prestamoService.crearPrestamo(dataToSubmit);
      fetchData(); // Refresh list
      handleCloseModal();
    } catch (err) {
      console.error("Error guardando préstamo:", err);
      alert(err.response?.data?.mensaje || "Error al generar el préstamo");
    }
  };

  const handleDeletePrestamo = async (prestamo) => {
    const confirmar = window.confirm(`🛑 ADVERTENCIA DE ELIMINACIÓN:\n\n¿Estás absolutamente seguro de que deseas anular y eliminar el Préstamo #${prestamo.id} por ${formatearMoneda(prestamo.monto)}?\n\nEsta acción también borrará DEFINITIVAMENTE todos los pagos y recibos asociados a este préstamo. No se puede deshacer.`);
    if (!confirmar) return;

    try {
      setLoading(true);
      await prestamoService.eliminarPrestamo(prestamo.id);
      fetchData();
    } catch (err) {
      console.error("Error eliminando préstamo:", err);
      alert(err.response?.data?.mensaje || "No tienes permisos para eliminar este préstamo o ocurrió un error.");
      setLoading(false);
    }
  };

  const handleOpenAmortizacion = async (prestamo) => {
    setSelectedPrestamo(prestamo);
    setShowAmortizacionModal(true);
    setLoadingAmortizacion(true);
    try {
      const resp = await cuotaService.obtenerCuotasDePrestamo(prestamo.id);
      setCuotasAmortizacion(resp.cuotas || []);
    } catch (err) {
      console.error('Error cargando cuotas:', err);
      alert('Error cargando la tabla de amortización.');
    } finally {
      setLoadingAmortizacion(false);
    }
  };

  const user = JSON.parse(localStorage.getItem('credisys_user')) || {};
  const isAdmin = user.rol === 'administrador';

  return (
    <div className="prestamos-container">
      <div className="header-actions">
        <div>
          <h1 className="dashboard-title">Gestión de Préstamos</h1>
          <p className="dashboard-subtitle">Crea nuevos préstamos y revisa el estado de los créditos otorgados.</p>
        </div>
        <button className="btn-primary" onClick={handleOpenModal}>
          + Nuevo Préstamo
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container fade-in">
        {loading ? (
          <div className="loading-state">Cargando préstamos...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Fecha Inicio</th>
                <th>Monto Prestado</th>
                <th>Plazo (Meses)</th>
                <th>Tasa</th>
                <th>Cuota Mensual</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {prestamos.length > 0 ? (
                prestamos.map(p => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>{p.clientes?.nombre} {p.clientes?.apellido}</td>
                    <td>{new Date(p.fecha_inicio).toLocaleDateString()}</td>
                    <td className="amount">{formatearMoneda(p.monto)}</td>
                    <td>{p.plazo_meses} meses</td>
                    <td>{(p.tasa_interes * 100).toFixed(2)}%</td>
                    <td className="amount">{formatearMoneda(p.cuota_mensual)}</td>
                    <td>
                      <span className={`badge badge-${p.estado.toLowerCase()}`}>
                        {p.estado}
                      </span>
                      <button 
                        className="btn-icon" 
                        onClick={() => handleOpenAmortizacion(p)} 
                        title="Ver Tabla de Amortización"
                        style={{ color: '#2563EB', marginLeft: '0.8rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
                      >
                        <Calendar size={18} />
                      </button>
                      {isAdmin && (
                        <button 
                          className="btn-icon" 
                          onClick={() => handleDeletePrestamo(p)} 
                          title="Eliminar Préstamo"
                          style={{ color: 'red', marginLeft: '0.8rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-state">No hay préstamos registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Aprobar Nuevo Préstamo</h2>
              <button className="close-btn" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="prestamo-form">
              <div className="form-grid">
                
                {/* Lado Izquierdo: Formulario */}
                <div className="form-inputs">
                  <div className="form-group full-width">
                    <label>Cliente (Prestatario) *</label>
                    <select name="cliente_id" className="form-control" value={formData.cliente_id} onChange={handleInputChange} required>
                      <option value="">-- Seleccione un cliente --</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre} {c.apellido} - {c.dni}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="row-group">
                    <div className="form-group">
                      <label>Monto a Prestar *</label>
                      <div className="input-with-prefix">
                        <span className="prefix">$</span>
                        <input type="number" step="0.01" name="monto" value={formData.monto} onChange={handleInputChange} placeholder="0.00" required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Fecha de Inicio *</label>
                      <input type="date" name="fecha_inicio" className="form-control" value={formData.fecha_inicio} onChange={handleInputChange} required />
                    </div>
                  </div>

                  <div className="row-group">
                    <div className="form-group">
                      <label>Tasa Mensual (%) *</label>
                      <div className="input-with-suffix">
                        <input type="number" step="0.01" name="tasa_interes" value={formData.tasa_interes} onChange={handleInputChange} placeholder="Ej: 5" required />
                        <span className="suffix">%</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Plazo (Meses) *</label>
                      <input type="number" name="plazo_meses" className="form-control" value={formData.plazo_meses} onChange={handleInputChange} placeholder="Ej: 12" required />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                    <button type="submit" className="btn-primary pulse">Generar Préstamo</button>
                  </div>
                </div>

                {/* Lado Derecho: Simulador en tiempo real */}
                <div className="simulator-panel">
                  <div className="simulator-header">
                    <Calculator size={20} />
                    <h3>Simulador de Cuota Fija</h3>
                  </div>
                  <div className="simulator-body">
                    <div className="sim-item highlight">
                      <span>Cuota Mensual:</span>
                      <strong>{formatearMoneda(simulacion.cuota)}</strong>
                    </div>
                    <div className="sim-item">
                      <span>Interés Total:</span>
                      <span>{formatearMoneda(simulacion.interesTotal)}</span>
                    </div>
                    <div className="sim-item total">
                      <span>Total a Pagar (Fin del Plazo):</span>
                      <strong>{formatearMoneda(simulacion.totalPagar)}</strong>
                    </div>
                  </div>
                  <div className="simulator-footer">
                    <small>* El cálculo utiliza el sistema de amortización francés de cuotas fijas.</small>
                  </div>
                </div>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE AMORTIZACIÓN */}
      {showAmortizacionModal && selectedPrestamo && (
        <div className="modal-overlay" onClick={() => setShowAmortizacionModal(false)}>
          <div className="modal-content modal-amortizacion" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cronograma de Pagos - Préstamo #{selectedPrestamo.id}</h2>
              <button className="close-btn" onClick={() => setShowAmortizacionModal(false)}>&times;</button>
            </div>
            
            <div className="amortizacion-details">
              <div className="detail-pill">
                <span>Cliente:</span>
                <strong>{selectedPrestamo.clientes?.nombre} {selectedPrestamo.clientes?.apellido}</strong>
              </div>
              <div className="detail-pill">
                <span>Monto Original:</span>
                <strong>{formatearMoneda(selectedPrestamo.monto)}</strong>
              </div>
              <div className="detail-pill">
                <span>Cuota Fijada:</span>
                <strong>{formatearMoneda(selectedPrestamo.cuota_mensual)}</strong>
              </div>
            </div>

            <div className="table-container amortizacion-table">
              {loadingAmortizacion ? (
                <div className="loading-state">Calculando cronograma...</div>
              ) : (
                <table className="data-table small">
                  <thead>
                    <tr>
                      <th># Cuota</th>
                      <th>Vencimiento</th>
                      <th className="amount">Monto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuotasAmortizacion.length > 0 ? (
                      cuotasAmortizacion.map(cuota => (
                        <tr key={cuota.id}>
                          <td>Cuota {cuota.numero_cuota}</td>
                          <td>{new Date(cuota.fecha_vencimiento).toLocaleDateString()}</td>
                          <td className="amount">{formatearMoneda(cuota.monto_cuota)}</td>
                          <td>
                            <span className={`badge badge-${cuota.estado.toLowerCase()}`}>
                              {cuota.estado}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="empty-state">No se encontraron cuotas para este préstamo.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="btn-primary" onClick={() => setShowAmortizacionModal(false)}>Aceptar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prestamos;
