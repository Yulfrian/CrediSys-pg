import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, Clock, CheckCircle, FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PaymentModal from '../components/UI/PaymentModal';
import SolicitudModal from '../components/UI/SolicitudModal';
import { solicitudService } from '../services/solicitudService';
import './ClientDashboard.css';
import api from '../services/api';

const ClientDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [prestamo, setPrestamo] = useState(null);
  const [proximaCuota, setProximaCuota] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  
  // States para Modales
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cuotaPagar, setCuotaPagar] = useState(null);
  
  const [showSolicitudModal, setShowSolicitudModal] = useState(false);
  const [misSolicitudes, setMisSolicitudes] = useState([]);

  useEffect(() => {
    cargarDatosCliente();
  }, []);

  const cargarDatosCliente = async () => {
    try {
      setLoading(true);
      // Llamada al endpoint seguro (Backend leerá el JWT)
      const prestamoRes = await api.get('/prestamos/mi-portal');
      const prestamosData = prestamoRes.data.prestamos || [];
      const miPrestamo = prestamosData[0]; // El primer préstamo activo del cliente
      
      setPrestamo(miPrestamo);

      if (miPrestamo) {
        // Obtenemos las cuotas de ese préstamo
        const cuotasRes = await api.get(`/cuotas/prestamo/${miPrestamo.id}`);
        const historial = cuotasRes.data.cuotas || [];
        setCuotas(historial);

        // La próxima cuota es la primera en estado "pendiente" o "parcial"
        const proxima = historial.find(c => c.estado === 'pendiente' || c.estado === 'parcial');
        setProximaCuota(proxima);
      }

      // Cargar mis solicitudes web
      try {
        const solRes = await solicitudService.obtenerMisSolicitudes();
        setMisSolicitudes(solRes.solicitudes || []);
      } catch (err) {
        console.error("Sin solicitudes");
      }

    } catch (error) {
      console.error("Error al cargar datos del cliente:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitudSuccess = () => {
    setShowSolicitudModal(false);
    alert('¡Tu solicitud ha sido enviada al banco exitosamente!');
    cargarDatosCliente();
  };

  const formatearMoneda = (value) => {
    return new Intl.NumberFormat('es-DO', { 
      style: 'currency', 
      currency: 'DOP',
    }).format(Number(value || 0));
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'N/A';
    const opciones = { day: '2-digit', month: 'long', year: 'numeric' };
    return new Date(fechaStr).toLocaleDateString('es-DO', opciones);
  };

  // Cuotas restantes
  const cuotasRestantes = cuotas.filter(c => c.estado !== 'pagada').length;
  const progresoPago = cuotas.length > 0 ? ((cuotas.length - cuotasRestantes) / cuotas.length) * 100 : 0;

  const handleOpenPayment = (cuota) => {
    setCuotaPagar(cuota);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setCuotaPagar(null);
    cargarDatosCliente(); // Refrescar los datos para ver el nuevo estado
  };

  const descargarPDF = async () => {
    const input = document.getElementById('reporte-cliente');
    if (!input) return;

    try {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Estado_Prestamo_${prestamo.id}.pdf`);
    } catch (error) {
      console.error("Error al generar PDF:", error);
    }
  };

  if (loading) {
    return <div className="client-loading">Cargando su información financiera...</div>;
  }

  if (!prestamo) {
    return (
      <div className="client-empty">
        <CheckCircle size={50} className="client-empty-icon" />
        <h2>Sin Préstamos Activos</h2>
        <p>Actualmente no tiene deuda o préstamos activos con nuestra institución.</p>
        
        {misSolicitudes.length > 0 ? (
          <div className="solicitudes-list" style={{ marginTop: '2rem', textAlign: 'left', width: '100%', maxWidth: '500px', backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: '1rem', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{marginBottom: '1rem'}}>Tus Solicitudes</h3>
            {misSolicitudes.map(sol => (
              <div key={sol.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span>RD${sol.monto} - {sol.plazo_meses} meses</span>
                <span className={`badge badge-${sol.estado.toLowerCase()}`}>{sol.estado}</span>
              </div>
            ))}
            <button className="btn-primary" style={{marginTop: '1.5rem', width: '100%'}} onClick={() => setShowSolicitudModal(true)}>
              Pedir Otro Préstamo
            </button>
          </div>
        ) : (
          <button className="btn-primary" style={{marginTop: '1rem'}} onClick={() => setShowSolicitudModal(true)}>
            Solicitar Préstamo Online
          </button>
        )}

        {showSolicitudModal && (
          <SolicitudModal 
            onClose={() => setShowSolicitudModal(false)}
            onSuccess={handleSolicitudSuccess}
          />
        )}
      </div>
    );
  }

  return (
    <div className="client-dashboard" id="reporte-cliente">
      {showPaymentModal && cuotaPagar && (
        <PaymentModal 
          cuota={cuotaPagar} 
          prestamo={prestamo} 
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      <div className="client-header">
        <div>
          <h1 className="client-title">Estado de mi Préstamo</h1>
          <p className="client-subtitle">Préstamo #{prestamo.id} • Aprobado el {formatearFecha(prestamo.fecha_inicio)}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowSolicitudModal(true)}>
          + Solicitar Nuevo Crédito
        </button>
      </div>

      {showSolicitudModal && (
        <SolicitudModal 
          onClose={() => setShowSolicitudModal(false)}
          onSuccess={handleSolicitudSuccess}
        />
      )}

      <div className="client-metrics-grid">
        {/* Tarjeta Principal: Saldo y Progreso */}
        <div className="client-card primary-card">
          <div className="client-card-header">
            <h3>Saldo Pendiente</h3>
            <span className="client-badge">Al día</span>
          </div>
          <div className="client-saldo-enorme">
            {formatearMoneda(prestamo.saldo_pendiente)}
          </div>
          <div className="client-progress-container">
            <div className="client-progress-meta">
              <span>Progreso del Pago</span>
              <span>{Math.round(progresoPago)}%</span>
            </div>
            <div className="client-progress-bar">
              <div className="client-progress-fill" style={{ width: `${progresoPago}%` }}></div>
            </div>
            <p className="client-progress-text">Se han pagado {cuotas.length - cuotasRestantes} de {cuotas.length} cuotas</p>
          </div>
        </div>

        {/* Tarjeta Secundaria: Próximo Pago */}
        <div className="client-card highlight-card">
          <h3>Próxima Cuota a Pagar</h3>
          {proximaCuota ? (
            <>
              <div className="client-cuota-monto">
                {formatearMoneda(proximaCuota.monto_cuota)}
              </div>
              <div className="client-cuota-details">
                <div className="client-detail-item">
                  <Calendar size={18} />
                  <span>Vence: <strong>{formatearFecha(proximaCuota.fecha_vencimiento)}</strong></span>
                </div>
                <div className="client-detail-item">
                  <Clock size={18} />
                  <span>Cuota N° {proximaCuota.numero_cuota} de {prestamo.plazo_meses}</span>
                </div>
              </div>
              <button className="btn-pay-now" onClick={() => handleOpenPayment(proximaCuota)}>
                <CreditCard size={18} /> Pagar en Línea Ahora
              </button>
            </>
          ) : (
             <div className="client-all-paid">
                <CheckCircle size={40} className="success-icon" />
                <p>Usted no tiene cuotas pendientes de pago en este momento.</p>
             </div>
          )}
        </div>
      </div>

      {/* Historial de Pagos Recientes */}
      <div className="client-history-section">
        <div className="client-history-header">
          <h3>Historial y Próximas Cuotas</h3>
          <button className="btn-secondary-client" onClick={descargarPDF}>
             <Download size={16} /> Descargar Estado
          </button>
        </div>
        
        <div className="client-table-container">
          <table className="client-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Vencimiento</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {cuotas.map((cuota, index) => (
                <tr key={index} className={cuota.estado === 'pagada' ? 'row-paid' : ''}>
                  <td>Cuota {cuota.numero_cuota}</td>
                  <td>{formatearFecha(cuota.fecha_vencimiento)}</td>
                  <td className="monto-cell">{formatearMoneda(cuota.monto_cuota)}</td>
                  <td>
                    {cuota.estado === 'pagada' && <span className="status-badge status-paid">Pagada</span>}
                    {cuota.estado === 'pendiente' && <span className="status-badge status-pending">Pendiente</span>}
                    {cuota.estado === 'parcial' && <span className="status-badge status-partial">Parcial</span>}
                  </td>
                  <td>
                    {cuota.estado !== 'pagada' ? (
                      <button className="btn-table-pay" onClick={() => handleOpenPayment(cuota)}>Pagar</button>
                    ) : (
                      <button className="btn-table-receipt"><FileText size={16}/></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
