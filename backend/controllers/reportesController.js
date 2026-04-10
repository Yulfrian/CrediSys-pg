import { supabase } from '../config/supabaseClient.js';

// GET /reportes/prestamos-activos
export const reportePrestamosActivos = async (req, res) => {
  try {
    const { data: prestamos, error } = await supabase
      .from('prestamos')
      .select('id, cliente_id, monto, saldo_pendiente, estado')
      .in('estado', ['activo', 'atrasado']);

    if (error) {
       console.error("Supabase Error prestamos-activos:", error);
       return res.status(500).json({ mensaje: 'Error al generar reporte de préstamos activos', detalle: error.message });
    }

    const totalActivos = prestamos.length;
    const capitalEnRiesgo = prestamos.reduce((sum, p) => sum + Number(p.saldo_pendiente), 0);

    return res.status(200).json({ 
        total_prestamos_activos: totalActivos,
        capital_pendiente_cobro: capitalEnRiesgo,
        detalle: prestamos 
    });
  } catch (err) {
    console.error("Try/Catch Error prestamos-activos:", err);
    return res.status(500).json({ mensaje: 'Error interno', detalle: err.message });
  }
};

// GET /reportes/clientes-morosos
export const reporteClientesMorosos = async (req, res) => {
    try {
      const { data: clientesEnMora, error } = await supabase
        .from('prestamos')
        .select(`
            id, saldo_pendiente,
            clientes (nombre)
        `)
        .eq('estado', 'atrasado');
      if (error) {
         console.error("Supabase Error clientes-morosos:", error);
         return res.status(500).json({ mensaje: 'Error al buscar clientes morosos', detalle: error.message });
      }
  
      return res.status(200).json({ total_morosos: clientesEnMora?.length || 0, clientes: clientesEnMora || [] });
    } catch (err) {
      console.error("Try/Catch Error clientes-morosos:", err);
      return res.status(500).json({ mensaje: 'Error interno', detalle: err.message });
    }
};

// GET /reportes/ganancias (Intereses cobrados)
export const reporteGanancias = async (req, res) => {
    try {
        // Para simplificar: Ganancia = Total Pagado - Capital (proporcionalmente). 
        // O más fácil, sumamos pagos de préstamos y restamos monto original si están pagados.
        // Aquí calculamos la suma de todos los pagos registrados.
        const { data: pagos, error } = await supabase
            .from('pagos')
            .select('monto_pagado');

        if (error) {
            console.error("Supabase Error ganancias:", error);
            return res.status(500).json({ mensaje: 'Error al calcular ganancias', detalle: error.message });
        }

        const totalIngresosGrales = (pagos || []).reduce((sum, p) => sum + Number(p.monto_pagado || 0), 0);

        return res.status(200).json({ ganancias_brutas_totales: totalIngresosGrales });
    } catch (err) {
        console.error("Try/Catch Error ganancias:", err);
        return res.status(500).json({ mensaje: 'Error interno', detalle: err.message });
    }
};

// GET /reportes/capital-prestado
export const reporteCapitalPrestado = async (req, res) => {
    try {
        const { data: prestamos, error } = await supabase
            .from('prestamos')
            .select('monto');

        if (error) {
            console.error("Supabase Error capital-prestado:", error);
            return res.status(500).json({ mensaje: 'Error al calcular capital prestado', detalle: error.message });
        }

        const totalCapitalPrestado = (prestamos || []).reduce((sum, p) => sum + Number(p.monto || 0), 0);

        return res.status(200).json({ total_capital_historico_prestado: totalCapitalPrestado });
    } catch (err) {
        console.error("Try/Catch Error capital-prestado:", err);
        return res.status(500).json({ mensaje: 'Error interno', detalle: err.message });
    }
};
