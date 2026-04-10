import { supabase } from '../config/supabaseClient.js';

// Ver cronograma de pagos de un préstamo (GET /cuotas/prestamo/:prestamo_id)
export const obtenerCuotasDePrestamo = async (req, res) => {
  try {
    const { prestamo_id } = req.params;

    // Seguridad: Si es un cliente, validar que el préstamo le pertenezca
    if (req.user && req.user.rol === 'cliente') {
       const { data: cliente } = await supabase.from('clientes').select('id').eq('usuario_id', req.user.id).single();
       if (!cliente) return res.status(403).json({ mensaje: 'Su cuenta no está vinculada a un cliente.' });
       
       const { data: prestamo } = await supabase.from('prestamos').select('id').eq('id', prestamo_id).eq('cliente_id', cliente.id).single();
       if (!prestamo) return res.status(403).json({ mensaje: 'Acceso denegado: Este préstamo no le pertenece.' });
    }

    const { data: cuotas, error } = await supabase
      .from('cuotas')
      .select('*')
      .eq('prestamo_id', prestamo_id)
      .order('numero_cuota', { ascending: true });

    if (error) {
      return res.status(500).json({ mensaje: 'Error al obtener las cuotas', detalle: error.message });
    }

    if (!cuotas.length) {
      return res.status(404).json({ mensaje: 'No se encontraron cuotas para este préstamo.' });
    }

    return res.status(200).json({ cuotas });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error interno en el servidor', detalle: err.message });
  }
};
