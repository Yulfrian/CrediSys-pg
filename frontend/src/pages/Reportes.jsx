import React, { useState, useEffect, useRef } from 'react';
import { reportesService } from '../services/reportesService';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList 
} from 'recharts';
import { Download, AlertTriangle, TrendingUp, DollarSign, Users, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './Reportes.css';

const Reportes = () => {
  const [loading, setLoading] = useState(true);
  const dashboardRef = useRef(null);

  // States para KPIs
  const [prestamosActivos, setPrestamosActivos] = useState(0);
  const [capitalPendiente, setCapitalPendiente] = useState(0);
  const [totalMorosos, setTotalMorosos] = useState(0);
  const [gananciasTotales, setGananciasTotales] = useState(0);
  const [capitalPrestado, setCapitalPrestado] = useState(0);
  const [listaMorosos, setListaMorosos] = useState([]);

  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      const [resActivos, resMorosos, resGanancias, resCapital] = await Promise.all([
        reportesService.obtenerPrestamosActivos(),
        reportesService.obtenerClientesMorosos(),
        reportesService.obtenerGanancias(),
        reportesService.obtenerCapitalPrestado()
      ]);

      setPrestamosActivos(resActivos.total_prestamos_activos || 0);
      setCapitalPendiente(resActivos.capital_pendiente_cobro || 0);

      setTotalMorosos(resMorosos.total_morosos || 0);
      setListaMorosos(resMorosos.clientes || []);

      setGananciasTotales(resGanancias.ganancias_brutas_totales || 0);
      setCapitalPrestado(resCapital.total_capital_historico_prestado || 0);
    } catch (error) {
      console.error("Error al cargar los reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (value) => {
    return new Intl.NumberFormat('es-DO', { 
      style: 'currency', 
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(value));
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text('Reporte Financiero - CrediSys', 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30);

    // Resumen de KPIs
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text('Resumen Operativo', 14, 45);

    const kpiData = [
      ['Capital Emitido (Histórico)', formatearMoneda(capitalPrestado)],
      ['Cartera Activa (En Calle)', formatearMoneda(capitalPendiente)],
      ['Intereses / Ingresos Brutos', formatearMoneda(gananciasTotales)],
      ['Préstamos Activos', prestamosActivos.toString()],
      ['Clientes Morosos', totalMorosos.toString()]
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Métrica', 'Valor']],
      body: kpiData,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40] }
    });

    let finalY = doc.lastAutoTable?.finalY || 100;

    // Tabla de Morosos
    if (listaMorosos.length > 0) {
      doc.text('Lista Roja: Clientes en Mora y Atrasos', 14, finalY + 15);
      
      const morososData = listaMorosos.map(m => [
        `${m.clientes?.nombre} ${m.clientes?.apellido}`,
        m.clientes?.telefono || '',
        `#${m.id}`,
        formatearMoneda(m.saldo_pendiente)
      ]);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Cliente / Deudor', 'Teléfono', 'ID Préstamo', 'Saldo en Peligro']],
        body: morososData,
        theme: 'striped',
        headStyles: { fillColor: [220, 38, 38] }
      });
    }

    doc.save(`Reporte_Financiero_CrediSys_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportarExcel = () => {
    // Hoja 1: Resumen de KPIs
    const kpiSheetData = [
      ['Reporte Financiero - CrediSys'],
      [`Fecha de generación: ${new Date().toLocaleDateString()}`],
      [],
      ['Métrica', 'Valor'],
      ['Capital Emitido (Histórico)', capitalPrestado],
      ['Cartera Activa (En Calle)', capitalPendiente],
      ['Intereses / Ingresos Brutos', gananciasTotales],
      ['Préstamos Activos', prestamosActivos],
      ['Clientes Morosos', totalMorosos]
    ];
    
    const wsKpis = XLSX.utils.aoa_to_sheet(kpiSheetData);

    // Hoja 2: Lista de Morosos
    const morososAoa = [
      ['Cliente', 'Teléfono', 'Email', 'ID Préstamo', 'Saldo Pendiente', 'Estado']
    ];
    
    listaMorosos.forEach(m => {
      morososAoa.push([
        `${m.clientes?.nombre} ${m.clientes?.apellido}`,
        m.clientes?.telefono || '',
        m.clientes?.email || '',
        m.id,
        m.saldo_pendiente,
        'Atrasado'
      ]);
    });

    const wsMorosos = XLSX.utils.aoa_to_sheet(morososAoa);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsKpis, "Resumen Operativo");
    XLSX.utils.book_append_sheet(wb, wsMorosos, "Lista Roja (Morosos)");
    
    XLSX.writeFile(wb, `Reporte_CrediSys_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Preparando datos para Recharts con Colores UI Kit
  const barData = [
    { name: 'Capital Inicial', monto: capitalPrestado, fill: '#4F46E5' }, // Indigo
    { name: 'Cartera Activa', monto: capitalPendiente, fill: '#0EA5E9' }, // Sky
    { name: 'Ganancias', monto: gananciasTotales, fill: '#10B981' }       // Emerald
  ];

  const pieData = [
    { name: 'Sanos / Regulares', value: prestamosActivos },
    { name: 'Atrasos (Mora)', value: totalMorosos }
  ];
  const PIE_COLORS = ['#10B981', '#EF4444'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <p className="label">{`${payload[0].name || label}`}</p>
          <p className="intro" style={{fontWeight: 'bold', color: payload[0].payload.fill || '#333'}}>
            {formatearMoneda(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="reportes-wrapper">
      <div className="reportes-header">
        <div>
          <h1 className="dashboard-title">Dashboard Analítico</h1>
          <p className="dashboard-subtitle">Monitoriza la salud financiera, capital y riesgo de tu cartera operativa.</p>
        </div>
        <div className="header-actions" style={{display: 'flex', gap: '10px'}}>
          <button className="btn-secondary" onClick={exportarExcel} disabled={loading} style={{width: 'max-content', display: 'flex', alignItems: 'center'}}>
            <FileSpreadsheet size={18} style={{marginRight: '8px'}}/> Exportar a Excel
          </button>
          <button className="btn-primary" onClick={exportarPDF} disabled={loading} style={{width: 'max-content', display: 'flex', alignItems: 'center'}}>
            <Download size={18} style={{marginRight: '8px'}}/> Exportar a PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Cargando métricas financieras...</div>
      ) : (
        <div className="dashboard-content fade-in" ref={dashboardRef}>
          {/* Fila 1: KPIs Cards */}
          <div className="kpi-grid">
            <div className="kpi-card card-blue">
              <div className="kpi-icon"><DollarSign size={24}/></div>
              <div className="kpi-info">
                <h3>Capital Emitido (Histórico)</h3>
                <p className="kpi-value">{formatearMoneda(capitalPrestado)}</p>
              </div>
            </div>
            
            <div className="kpi-card card-green">
              <div className="kpi-icon"><TrendingUp size={24}/></div>
              <div className="kpi-info">
                <h3>Intereses / Ingresos</h3>
                <p className="kpi-value">{formatearMoneda(gananciasTotales)}</p>
              </div>
            </div>

            <div className="kpi-card card-yellow">
              <div className="kpi-icon"><Users size={24}/></div>
              <div className="kpi-info">
                <h3>Cartera Activa (En Calle)</h3>
                <p className="kpi-value">{formatearMoneda(capitalPendiente)}</p>
                <span className="kpi-subtext">{prestamosActivos} préstamos vivos</span>
              </div>
            </div>

            <div className="kpi-card card-red">
              <div className="kpi-icon"><AlertTriangle size={24}/></div>
              <div className="kpi-info">
                <h3>Riesgo / Morosidad</h3>
                <p className="kpi-value rojo">{totalMorosos}</p>
                <span className="kpi-subtext">Clientes en Atraso</span>
              </div>
            </div>
          </div>

          {/* Fila 2: Gráficos */}
          <div className="charts-grid">
            <div className="chart-box">
              <h3>Distribución Estratégica (RD$)</h3>
              <div className="chart-container">
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={barData} margin={{ top: 30, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748B', fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.02)'}} />
                    <Bar dataKey="monto" radius={[6, 6, 0, 0]} maxBarSize={70}>
                      <LabelList 
                        dataKey="monto" 
                        position="top" 
                        formatter={(val) => formatearMoneda(val)} 
                        style={{ fontSize: '12px', fontWeight: 'bold', fill: '#334155' }} 
                        offset={10}
                      />
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-box">
              <h3>Distribución de Riesgo Operativo</h3>
              <div className="chart-container">
                <ResponsiveContainer width="99%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Fila 3: Tabla de Morosos (Lista Roja) */}
          <div className="table-box">
            <div className="table-header">
              <h3>Lista Roja: Clientes en Mora y Atrasos</h3>
              <span className={`badge ${listaMorosos.length > 0 ? 'badge-error' : 'badge-success'}`}>
                {listaMorosos.length} Registros
              </span>
            </div>
            
            {listaMorosos.length > 0 ? (
              <table className="morosos-table">
                <thead>
                  <tr>
                    <th>Cliente / Deudor</th>
                    <th>Contacto</th>
                    <th>ID Préstamo</th>
                    <th>Saldo en Peligro</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {listaMorosos.map((prestamo, index) => (
                    <tr key={index}>
                      <td>
                        <strong>{prestamo.clientes?.nombre} {prestamo.clientes?.apellido}</strong>
                      </td>
                      <td>
                        <div>{prestamo.clientes?.telefono}</div>
                        <small className="text-muted">{prestamo.clientes?.email}</small>
                      </td>
                      <td>#{prestamo.id}</td>
                      <td className="monto-peligro">{formatearMoneda(prestamo.saldo_pendiente)}</td>
                      <td><span className="badge badge-error">Atrasado</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state-list">
                <CheckCircle size={40} className="empty-icon-green" />
                <h4>¡Estabilidad Perfecta!</h4>
                <p>No existen clientes atrasados o en estado de morosidad en el sistema.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default Reportes;
