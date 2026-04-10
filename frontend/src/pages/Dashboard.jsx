import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  DollarSign, 
  AlertTriangle 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    prestamosActivos: 0,
    capitalPendiente: 0,
    clientesMorosos: 0,
    ganancias: 0,
    capitalPrestado: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dejamos el historial de flujo en 0 ya que no hay endpoints temporales aún,
  // y así el usuario no ve datos falsos (mock data).
  const chartData = [];

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Execute parallel requests to the reporting endpoints
        const [activosRes, morososRes, gananciasRes, capitalRes] = await Promise.all([
          api.get('/reportes/prestamos-activos'),
          api.get('/reportes/clientes-morosos'),
          api.get('/reportes/ganancias'),
          api.get('/reportes/capital-prestado')
        ]);

        setStats({
          prestamosActivos: activosRes.data.total_prestamos_activos || 0,
          capitalPendiente: activosRes.data.capital_pendiente_cobro || 0,
          clientesMorosos: morososRes.data.total_morosos || 0,
          ganancias: gananciasRes.data.ganancias_brutas_totales || 0,
          capitalPrestado: capitalRes.data.total_capital_historico_prestado || 0
        });

      } catch (err) {
        console.error("Error cargando dashboard:", err);
        setError('No se pudieron cargar las estadísticas. Verifica tu conexión o permisos.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-DO', { 
      style: 'currency', 
      currency: 'DOP',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(value);
  };

  const pieData = [
    { name: 'Recuperado/Ganancia', value: stats.ganancias },
    { name: 'En Riesgo (Mora)', value: stats.clientesMorosos * 1000 }, // Mock calculation for viz
    { name: 'Pendiente Cobro', value: stats.capitalPendiente }
  ];

  if (loading) {
    return <div className="loading-container">Cargando métricas de CrediSys...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="page-header mb-6">
        <div>
          <h1 className="text-2xl font-bold">Resumen Financiero</h1>
          <p className="text-muted">Vista general del rendimiento de tus préstamos.</p>
        </div>
      </header>
      
      {error && <div className="error-alert mb-4">{error}</div>}

      {/* Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card glass">
          <div className="stat-icon-wrapper primary">
            <DollarSign size={24} />
          </div>
          <div className="stat-details">
            <p className="stat-title">Capital Total Prestado</p>
            <h3 className="stat-value">{formatCurrency(stats.capitalPrestado)}</h3>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon-wrapper success">
            <TrendingUp size={24} />
          </div>
          <div className="stat-details">
            <p className="stat-title">Ingresos y Ganancias</p>
            <h3 className="stat-value">{formatCurrency(stats.ganancias)}</h3>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon-wrapper info">
            <Briefcase size={24} />
          </div>
          <div className="stat-details">
            <p className="stat-title">Préstamos Activos</p>
            <h3 className="stat-value">{stats.prestamosActivos}</h3>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon-wrapper danger">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-details">
            <p className="stat-title">Clientes en Mora</p>
            <h3 className="stat-value">{stats.clientesMorosos}</h3>
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="charts-grid mt-8">
        {/* Bar Chart */}
        <div className="chart-card glass">
          <h3 className="chart-title mb-4">Flujo de Caja Mensual</h3>
          <div className="chart-wrapper">
            {chartData.length === 0 ? (
              <div style={{ display: 'flex', height: '300px', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted, #94a3b8)' }}>
                <p>No hay datos suficientes</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)'}} />
                  <Bar dataKey="ingresos" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Ingresos" />
                  <Bar dataKey="prestamos" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} name="Préstamos Emitidos" />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="chart-card glass">
          <h3 className="chart-title mb-4">Distribución de Capital</h3>
          <div className="chart-wrapper">
            {pieData.reduce((acc, curr) => acc + curr.value, 0) === 0 ? (
              <div style={{ display: 'flex', height: '300px', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted, #94a3b8)' }}>
                <p>No hay datos suficientes</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)'}} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
