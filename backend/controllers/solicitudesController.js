import { supabase } from '../config/supabaseClient.js';

// 1. Crear Solicitud (Portal Cliente)
export const crearSolicitud = async (req, res) => {
  try {
    const { monto, plazo_meses, motivo } = req.body;
    const usuario_id = req.user.id; // Del JWT

    // Validar que el usuario logueado en la web tenga un perfil de cliente
    const { data: cliente } = await supabase.from('clientes').select('id').eq('usuario_id', usuario_id).single();
    if (!cliente) {
      return res.status(403).json({ mensaje: 'Su cuenta no está vinculada a un perfil financiero.' });
    }

    if (!monto || !plazo_meses) {
      return res.status(400).json({ mensaje: 'Monto y Plazo son obligatorios' });
    }

    const { data, error } = await supabase
      .from('solicitudes_prestamo')
      .insert([{ cliente_id: cliente.id, monto, plazo_meses, motivo }])
      .select()
      .single();

    if (error) return res.status(500).json({ mensaje: 'Error registrando solicitud', detalle: error.message });

    // Enviar Notificación al Admin (Opcional, pero muy util)
    await supabase.from('notificaciones').insert([{
      mensaje: `Nueva Solicitud Web: RD$${monto} a ${plazo_meses} meses`,
      tipo: 'warning'
    }]);

    return res.status(201).json({ mensaje: 'Solicitud enviada exitosamente', solicitud: data });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error interno', detalle: err.message });
  }
};

// 2. Obtener todas las solicitudes (Portal Admin)
export const obtenerSolicitudes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('solicitudes_prestamo')
      .select('*, clientes(nombre, apellido, dni)')
      .order('fecha_solicitud', { ascending: false });

    if (error) return res.status(500).json({ mensaje: 'Error al consultar solicitudes', detalle: error.message });

    return res.status(200).json({ solicitudes: data || [] });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error interno', detalle: err.message });
  }
};

// 3. Obtener solo las solicitudes del propio cliente (Portal Cliente)
export const obtenerMisSolicitudes = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const { data: cliente } = await supabase.from('clientes').select('id').eq('usuario_id', usuario_id).single();
    if (!cliente) return res.status(200).json({ solicitudes: [] });

    const { data, error } = await supabase
      .from('solicitudes_prestamo')
      .select('*')
      .eq('cliente_id', cliente.id)
      .order('fecha_solicitud', { ascending: false });

    if (error) return res.status(500).json({ mensaje: 'Error al consultar sus solicitudes', detalle: error.message });

    return res.status(200).json({ solicitudes: data || [] });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error interno', detalle: err.message });
  }
};

// 4. Cambiar estado de la solicitud (Aprobar/Rechazar) - Admin
export const cambiarEstadoSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, tasa_interes, fecha_inicio } = req.body; // 'aprobada' o 'rechazada'

    if (!['aprobada', 'rechazada'].includes(estado)) {
      return res.status(400).json({ mensaje: 'Estado inválido' });
    }

    // Validaciones extras si es aprobada
    if (estado === 'aprobada') {
      if (tasa_interes === undefined || !fecha_inicio) {
         return res.status(400).json({ mensaje: 'Tasa de interés y fecha de inicio son obligatorios para aprobar el préstamo.'});
      }
    }

    // Obtener información de la solicitud
    const { data: solicitud, error: solError } = await supabase
      .from('solicitudes_prestamo')
      .select('*, clientes(usuario_id)')
      .eq('id', id)
      .single();

    if (solError || !solicitud) {
       return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    // Actualizar el estado de la solicitud en la base
    const { error: updateError } = await supabase
      .from('solicitudes_prestamo')
      .update({ estado })
      .eq('id', id);

    if (updateError) return res.status(500).json({ mensaje: 'Error actualizando estado de solicitud', detalle: updateError.message });

    let prestamoInsertado = null;

    // Si fue aprobada, procedemos a engranar el préstamo formal
    if (estado === 'aprobada') {
       const monto = parseFloat(solicitud.monto);
       const plazo_meses = parseInt(solicitud.plazo_meses);
       const tasaDecimal = parseFloat(tasa_interes) / 100;

       let cuota_mensual = 0;
       let total_a_pagar = 0;

       if (tasaDecimal === 0) {
          cuota_mensual = monto / plazo_meses;
          total_a_pagar = monto;
       } else {
          const factor = Math.pow(1 + tasaDecimal, plazo_meses);
          cuota_mensual = monto * (tasaDecimal * factor) / (factor - 1);
          total_a_pagar = cuota_mensual * plazo_meses;
       }

       cuota_mensual = parseFloat(cuota_mensual.toFixed(2));
       total_a_pagar = parseFloat(total_a_pagar.toFixed(2));

       // Insertar el Prestamo
       const { data: prestamo, error: prestamoError } = await supabase
         .from('prestamos')
         .insert([{
            cliente_id: solicitud.cliente_id,
           monto: monto,
           tasa_interes: tasaDecimal,
           plazo_meses: plazo_meses,
           fecha_inicio: fecha_inicio,
           total_a_pagar: total_a_pagar,
           cuota_mensual: cuota_mensual,
           saldo_pendiente: total_a_pagar,
           estado: 'activo'
         }])
         .select()
         .single();

       if (prestamoError) return res.status(500).json({ mensaje: 'Error generando préstamo', detalle: prestamoError.message });
       
       prestamoInsertado = prestamo;

       // Generar cuotas
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

       await supabase.from('cuotas').insert(cuotas);
    }

    // Notificar al cliente
    if (solicitud && solicitud.clientes && solicitud.clientes.usuario_id) {
       let msj = `Tu solicitud de préstamo por RD$${solicitud.monto} ha sido RECHAZADA.`;
       if (estado === 'aprobada') {
          msj = `¡Felicidades! Tu préstamo online (RD$${solicitud.monto}) ha sido APROBADO y emitido exitosamente.`;
       }
       await supabase.from('notificaciones').insert([{
         usuario_id: solicitud.clientes.usuario_id,
         mensaje: msj,
         tipo: estado === 'aprobada' ? 'success' : 'error'
       }]);
    }

    return res.status(200).json({ mensaje: `Solicitud ${estado} con éxito`, prestamoGenerado: prestamoInsertado });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error interno', detalle: err.message });
  }
};
