import { supabase } from '../config/supabaseClient.js';

// Crear préstamo nuevo (POST /prestamos) - Ocupa la lógica financiera 
export const crearPrestamo = async (req, res) => {
  try {
    const { cliente_id, monto, tasa_interes, plazo_meses, fecha_inicio } = req.body;

    if (!cliente_id || !monto || !tasa_interes || !plazo_meses || !fecha_inicio) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    }

    // Lógica financiera - Sistema Francés (Cuota Fija)
    let cuota_mensual = 0;
    let interes_total = 0;
    let total_a_pagar = 0;

    if (tasa_interes === 0) {
      cuota_mensual = monto / plazo_meses;
      total_a_pagar = monto;
    } else {
      const i = tasa_interes; // Ya convertido a decimal desde el frontend
      const n = plazo_meses;
      const factor = Math.pow(1 + i, n);
      cuota_mensual = monto * (i * factor) / (factor - 1);
      total_a_pagar = cuota_mensual * n;
      interes_total = total_a_pagar - monto;
    }

    cuota_mensual = parseFloat(cuota_mensual.toFixed(2));
    total_a_pagar = parseFloat(total_a_pagar.toFixed(2));
    
    const saldo_pendiente_inicial = total_a_pagar;

    // 1. Crear Préstamo
    const { data: prestamo, error: prestamoError } = await supabase
      .from('prestamos')
      .insert([{
        cliente_id,
        monto,
        tasa_interes,
        plazo_meses,
        fecha_inicio,
        total_a_pagar,
        cuota_mensual,
        saldo_pendiente: saldo_pendiente_inicial,
        estado: 'activo'
      }])
      .select()
      .single();

    if (prestamoError) return res.status(500).json({ mensaje: 'Error al crear préstamo', detalle: prestamoError.message });

    // 2. Generar Cuotas automáticamente
    const cuotas = [];
    const fechaInicioObj = new Date(fecha_inicio);

    for (let i = 1; i <= plazo_meses; i++) {
        const fechaVencimiento = new Date(fechaInicioObj);
        fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i);

        cuotas.push({
            prestamo_id: prestamo.id,
            numero_cuota: i,
            monto_cuota: cuota_mensual,
            fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0], 
            estado: 'pendiente'
        });
    }

    // 3. Insertar cuotas
    const { error: cuotasError } = await supabase
      .from('cuotas')
      .insert(cuotas);

    if (cuotasError) {
        // Podríamos eliminar el préstamo si fallaran las cuotas (compensación), pero simplificamos retornando el error.
        return res.status(500).json({ mensaje: 'Préstamo creado pero error al generar cuotas', detalle: cuotasError.message });
    }

    // 4. Crear notificación automática para administradores
    await supabase.from('notificaciones').insert([{
      mensaje: `Nuevo préstamo aprobado por RD$${monto}`,
      tipo: 'success'
    }]);

    return res.status(201).json({ 
        mensaje: 'Préstamo creado exitosamente', 
        prestamo, 
        cuotas_generadas: plazo_meses 
    });

  } catch (err) {
    return res.status(500).json({ mensaje: 'Error interno en el servidor', detalle: err.message });
  }
};

// Listar préstamos (GET /prestamos)
export const obtenerPrestamos = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('prestamos')
            .select(`
                *,
                clientes (nombre, apellido, dni)
            `)
            .order('fecha_creacion', { ascending: false });

        if (error) return res.status(500).json({ mensaje: 'Error al obtener préstamos', detalle: error.message });
        return res.status(200).json({ prestamos: data });
    } catch (err) {
        return res.status(500).json({ mensaje: 'Error en el servidor', detalle: err.message });
    }
};

// Ver detalles del préstamo (GET /prestamos/:id)
export const obtenerPrestamoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('prestamos')
            .select(`
                *,
                clientes (nombre, apellido, dni, email, telefono)
            `)
            .eq('id', id)
            .single();

        if (error || !data) return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
        return res.status(200).json({ prestamo: data });
    } catch (err) {
        return res.status(500).json({ mensaje: 'Error en el servidor', detalle: err.message });
    }
};

// Ver préstamos de un cliente (GET /prestamos/cliente/:cliente_id)
export const obtenerPrestamosDeCliente = async (req, res) => {
    try {
        const { cliente_id } = req.params;
        const { data, error } = await supabase
            .from('prestamos')
            .select('*')
            .eq('cliente_id', cliente_id)
            .order('fecha_inicio', { ascending: false });

        if (error) return res.status(500).json({ mensaje: 'Error al buscar préstamos del cliente', detalle: error.message });
        return res.status(200).json({ prestamos: data });
    } catch (err) {
        return res.status(500).json({ mensaje: 'Error en el servidor', detalle: err.message });
    }
};

// Ver solo mis propios préstamos (Endpoint Seguro para Portal Cliente)
export const obtenerMisPrestamos = async (req, res) => {
    try {
        const usuario_id = req.user.id;
        
        // 1. Encontrar el cliente asociado al JWT (usuario_id)
        const { data: cliente, error: cliError } = await supabase
            .from('clientes')
            .select('id')
            .eq('usuario_id', usuario_id)
            .single();

        if (cliError || !cliente) {
            return res.status(403).json({ mensaje: 'Su cuenta no está vinculada a un cliente activo.' });
        }

        // 2. Traer solo sus propios préstamos
        const { data, error } = await supabase
            .from('prestamos')
            .select('*, clientes (nombre, apellido, dni)')
            .eq('cliente_id', cliente.id)
            .order('fecha_inicio', { ascending: false });

        if (error) return res.status(500).json({ mensaje: 'Error al buscar sus préstamos', detalle: error.message });
        return res.status(200).json({ prestamos: data });
    } catch (err) {
        return res.status(500).json({ mensaje: 'Error en el servidor', detalle: err.message });
    }
};

// Eliminar prestamo en cascada (DELETE /prestamos/:id)
export const eliminarPrestamo = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Eliminar pagos vinculados a este préstamo
        await supabase.from('pagos').delete().eq('prestamo_id', id);
        
        // 1.5. Eliminar cuotas y documentos (por si el CASCADE en DB falla)
        await supabase.from('cuotas').delete().eq('prestamo_id', id);
        await supabase.from('documentos').delete().eq('prestamo_id', id);

        // 2. Eliminar el préstamo
        const { error } = await supabase.from('prestamos').delete().eq('id', id);

        if (error) return res.status(500).json({ mensaje: 'Error al eliminar el préstamo', detalle: error.message });

        return res.status(200).json({ mensaje: 'Préstamo y sus dependencias eliminados exitosamente' });
    } catch (err) {
        return res.status(500).json({ mensaje: 'Error en el servidor', detalle: err.message });
    }
};
