import React, { useState, useEffect, useRef } from 'react';
import { prestamoService } from '../services/prestamoService';
import { cuotaService } from '../services/cuotaService';
import { pagoService } from '../services/pagoService';
import { Search, ChevronDown, CheckCircle, Download, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './Pagos.css';

const Pagos = () => {
  const [prestamos, setPrestamos] = useState([]);
  const [prestamosFiltrados, setPrestamosFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Pago
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [cuotaAPagar, setCuotaAPagar] = useState(null);
  const [tipoPago, setTipoPago] = useState('completo'); // completo | parcial
  const [montoPago, setMontoPago] = useState('');

  // Modal Recibo
  const [showRecibo, setShowRecibo] = useState(false);
  const [datosRecibo, setDatosRecibo] = useState(null);
  const reciboRef = useRef(null);

  useEffect(() => {
    fetchPrestamosActivos();
  }, []);

  const fetchPrestamosActivos = async () => {
    try {
      setLoading(true);
      const data = await prestamoService.obtenerPrestamos();
      // Filtrar solos los activos
      const activos = data.prestamos?.filter(p => ['activo', 'moroso'].includes(p.estado.toLowerCase())) || [];
      setPrestamos(activos);
      setPrestamosFiltrados(activos);
    } catch (error) {
      console.error("Error al cargar préstamos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setBusqueda(term);
    setPrestamosFiltrados(
      prestamos.filter(p => 
        p.clientes?.nombre?.toLowerCase().includes(term) || 
        p.clientes?.apellido?.toLowerCase().includes(term) ||
        p.clientes?.dni?.includes(term) ||
        p.id.toString() === term
      )
    );
  };

  const seleccionarPrestamo = async (prestamo) => {
    setPrestamoSeleccionado(prestamo);
    try {
      setLoading(true);
      const data = await cuotaService.obtenerCuotasDePrestamo(prestamo.id);
      setCuotas(data.cuotas || []);
    } catch (error) {
      console.error("Error cargando cuotas:", error);
      alert("No se pudieron cargar las cuotas de este préstamo.");
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(valor));
  };

  const abrirModalPago = (cuota) => {
    setCuotaAPagar(cuota);
    setTipoPago('completo');
    setMontoPago(cuota.monto_cuota);
    setShowPagoModal(true);
  };

  const handleMontoChange = (e) => {
    setMontoPago(e.target.value);
  };

  const procesarPago = async (e) => {
    e.preventDefault();
    if (!montoPago || montoPago <= 0) {
      alert("Ingrese un monto válido mayor a 0.");
      return;
    }

    try {
      const pagoData = {
        prestamo_id: prestamoSeleccionado.id,
        cuota_id: cuotaAPagar.id,
        monto_pagado: parseFloat(montoPago)
      };

      await pagoService.registrarPago(pagoData);

      // Preparamos datos recibo antes de refrescar
      const nuevoSaldoPendiente = prestamoSeleccionado.saldo_pendiente - pagoData.monto_pagado;

      const dataRec = {
        nroRecibo: Math.floor(Math.random() * 10000) + 1000,
        fecha: new Date().toLocaleString(),
        cliente: `${prestamoSeleccionado.clientes?.nombre} ${prestamoSeleccionado.clientes?.apellido}`,
        dni: prestamoSeleccionado.clientes?.dni,
        monto: pagoData.monto_pagado,
        cuotaNum: cuotaAPagar.numero_cuota,
        tipoPago: tipoPago,
        saldoRestante: nuevoSaldoPendiente
      };

      setShowPagoModal(false);
      
      // Actualizar vista local (Refrescar saldo localmente y cuotas)
      setPrestamoSeleccionado(prev => prev ? { ...prev, saldo_pendiente: nuevoSaldoPendiente } : null);
      await seleccionarPrestamo(prestamoSeleccionado);
      
      // Mostrar Recibo
      setDatosRecibo(dataRec);
      setShowRecibo(true);

    } catch (error) {
      console.error("Error procesando", error);
      alert(error.response?.data?.mensaje || "Error al procesar el pago");
    }
  };

  const exportarReciboComoImagen = async () => {
    if (!reciboRef.current) return;
    const canvas = await html2canvas(reciboRef.current, { scale: 2 });
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `Recibo_${datosRecibo.nroRecibo}.png`;
    link.click();
  };

  const exportarReciboComoPDF = async () => {
    if (!reciboRef.current) return;
    const canvas = await html2canvas(reciboRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    // Relación de aspecto
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
    pdf.save(`Recibo_Pago_CrediSys_${datosRecibo.nroRecibo}.pdf`);
  };

  return (
    <div className="pagos-container">
      <div className="pagos-header">
        <div>
          <h1 className="dashboard-title">Registro de Pagos</h1>
          <p className="dashboard-subtitle">Administra los cobros buscando clientes o seleccionando un préstamo activo.</p>
        </div>
      </div>

      <div className="layout-grid">
        {/* Lado Izquierdo: Buscador de Préstamos */}
        <div className="panel izquierdo">
          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por cliente, cédula o Nro. Préstamo..." 
              value={busqueda}
              onChange={handleSearch}
            />
          </div>

          <div className="lista-prestamos">
            {loading && !prestamoSeleccionado ? <div className="loading">Cargando préstamos...</div> : null}
            {!loading && prestamosFiltrados.length === 0 ? <div className="empty">No hay préstamos activos.</div> : null}
            
            {prestamosFiltrados.map(p => (
              <div 
                key={p.id} 
                className={`prestamo-card ${prestamoSeleccionado?.id === p.id ? 'active' : ''}`}
                onClick={() => seleccionarPrestamo(p)}
              >
                <div className="card-header">
                  <strong>#{p.id} - {p.clientes?.nombre} {p.clientes?.apellido}</strong>
                  <span className="badge badge-activo">Activo</span>
                </div>
                <div className="card-details">
                  <span>Monto: {formatearMoneda(p.monto)}</span>
                  <span>Cuota: {formatearMoneda(p.cuota_mensual)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lado Derecho: Detalles y Cronograma de Cuotas */}
        <div className="panel derecho">
          {prestamoSeleccionado ? (
            <div className="cronograma-container">
              <div className="cronograma-header">
                <h2>Cronograma de Pagos: Préstamo #{prestamoSeleccionado.id}</h2>
                <div className="cliente-info">
                  Deudor: {prestamoSeleccionado.clientes?.nombre} {prestamoSeleccionado.clientes?.apellido} | 
                  Saldo Restante: {formatearMoneda(prestamoSeleccionado.saldo_pendiente)}
                </div>
              </div>

              <div className="cuotas-list fade-in">
                {cuotas.map((cuota, index) => {
                  const pagada = cuota.estado === 'pagada';
                  const parcial = cuota.estado === 'parcial';
                  // Identificamos cual es la proxima cuota pendiente para habilitarle el pago primario 
                  // Esto asume que el backend ordena por numero_cuota ASC
                  const isCurrent = !pagada && (index === 0 || cuotas[index-1].estado === 'pagada' || cuotas[index-1].estado === 'parcial');
                  
                  return (
                    <div key={cuota.id} className={`cuota-item ${pagada ? 'pagada' : ''} ${parcial ? 'parcial' : ''} ${isCurrent && !pagada ? 'current' : ''}`}>
                      <div className="cuota-info">
                        <div className="cuota-numero">Cuota #{cuota.numero_cuota}</div>
                        <div className="cuota-vencimiento">Vence: {new Date(cuota.fecha_vencimiento).toLocaleDateString()}</div>
                      </div>
                      
                      <div className="cuota-monto">
                        {formatearMoneda(cuota.monto_cuota)}
                        <span className={`estado-label ${cuota.estado}`}>{cuota.estado.toUpperCase()}</span>
                      </div>

                      <div className="cuota-accion">
                        {pagada ? (
                          <CheckCircle className="icon-success" size={24} />
                        ) : isCurrent ? (
                          <button className="btn-primary" onClick={() => abrirModalPago(cuota)}>
                            💸 Abonar
                          </button>
                        ) : (
                          <button className="btn-primary" disabled style={{opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#9ca3af'}}>
                            Bloqueado
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="empty-state-large">
              <Search size={48} className="empty-icon" />
              <h3>Selecciona un préstamo</h3>
              <p>Busca en el panel izquierdo y selecciona el préstamo para registrarle un pago.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Confirmar Pago (Completo / Parcial) */}
      {showPagoModal && (
        <div className="modal-overlay" onClick={() => setShowPagoModal(false)}>
          <div className="modal-content modal-pago" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Pago - Cuota #{cuotaAPagar.numero_cuota}</h2>
              <button className="close-btn" onClick={() => setShowPagoModal(false)}>&times;</button>
            </div>
            <form onSubmit={procesarPago}>
              <div className="pago-body">
                <div className="summary-box">
                  <p>Monto original cuota: <strong>{formatearMoneda(cuotaAPagar.monto_cuota)}</strong></p>
                </div>
                
                <div className="tipo-pago-toggle">
                  <button type="button" className={tipoPago === 'completo' ? 'active' : ''} onClick={() => { setTipoPago('completo'); setMontoPago(cuotaAPagar.monto_cuota); }}>
                    Pago Completo
                  </button>
                  <button type="button" className={tipoPago === 'parcial' ? 'active' : ''} onClick={() => { setTipoPago('parcial'); setMontoPago(''); }}>
                    Pago Parcial
                  </button>
                </div>

                <div className="form-group slide-down">
                  <label>{tipoPago === 'completo' ? 'Monto Cobrado (Inalterable)' : 'Digite el monto a abonar'} *</label>
                  <div className="input-with-prefix">
                    <span className="prefix">$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={montoPago} 
                      onChange={handleMontoChange} 
                      required 
                      readOnly={tipoPago === 'completo'}
                      max={cuotaAPagar.monto_cuota}
                      autoFocus={tipoPago === 'parcial'}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPagoModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary uppercase" style={{backgroundColor: '#10b981'}}>PROCESAR COBRO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Recibo Finalizado */}
      {showRecibo && datosRecibo && (
        <div className="modal-overlay receipt-overlay" onClick={() => setShowRecibo(false)}>
          <div className="modal-content modal-recibo" onClick={(e) => e.stopPropagation()}>
            <div className="recibo-container" ref={reciboRef}>
              <div className="recibo-header">
                <h2>CrediSys</h2>
                <p>COMPROBANTE DE PAGO</p>
              </div>
              <div className="recibo-body">
                <div className="r-row"><span className="r-label">Nro. Recibo:</span> <strong>{datosRecibo.nroRecibo}</strong></div>
                <div className="r-row"><span className="r-label">Fecha:</span> <span>{datosRecibo.fecha}</span></div>
                <hr className="r-divider"/>
                <div className="r-row"><span className="r-label">Cliente:</span> <span className="r-value">{datosRecibo.cliente}</span></div>
                <div className="r-row"><span className="r-label">Cédula:</span> <span>{datosRecibo.dni}</span></div>
                <hr className="r-divider"/>
                <div className="r-row">
                  <span className="r-label">Concepto:</span> 
                  <span>{datosRecibo.tipoPago === 'parcial' ? 'Abono a Cuota #' : 'Pago de Cuota #'}{datosRecibo.cuotaNum}</span>
                </div>
                <div className="r-row">
                  <span className="r-label">Saldo Restante:</span> 
                  <span>{formatearMoneda(datosRecibo.saldoRestante)}</span>
                </div>
                <div className="r-row r-total">
                  <span className="r-label">TOTAL RECIBIDO:</span> 
                  <strong>{formatearMoneda(datosRecibo.monto)}</strong>
                </div>
              </div>
              <div className="recibo-footer">
                ¡Gracias por su pago!
              </div>
            </div>

            <div className="receipt-actions">
              <button className="btn-secondary" onClick={exportarReciboComoImagen}>
                <ImageIcon size={18} /> Guardar Imagen
              </button>
              <button className="btn-primary" onClick={exportarReciboComoPDF}>
                <Download size={18} /> Descargar PDF
              </button>
              <button className="btn-link" onClick={() => setShowRecibo(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagos;
