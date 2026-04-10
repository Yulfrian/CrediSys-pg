import { supabase } from '../config/supabaseClient.js';

// Registrar un pago (POST /pagos) - Lógica financiera de registro de pagos
export const registrarPago = async (req, res) => {
  try {
    const { prestamo_id, cuota_id, monto_pagado } = req.body;

    if (!prestamo_id || !cuota_id || !monto_pagado) {
        return res.status(400).json({ mensaje: 'Faltan parámetros (prestamo_id, cuota_id o monto_pagado)' });
    }

    // 1. Validar cuota
    const { data: cuota, error: errorC } = await supabase
        .from('cuotas')
        .select('*')
        .eq('id', cuota_id)
        .single();
        
    if (errorC || !cuota) return res.status(404).json({ mensaje: 'Cuota no encontrada' });
    if (cuota.estado === 'pagada') return res.status(400).json({ mensaje: 'Esta cuota ya se encuentra pagada' });
    if (cuota.prestamo_id !== prestamo_id) return res.status(400).json({ mensaje: 'La cuota no pertenece a este préstamo' });

    // 2. Obtener saldo actual del préstamo
    const { data: prestamo, error: errorP } = await supabase
        .from('prestamos')
        .select('saldo_pendiente, estado')
        .eq('id', prestamo_id)
        .single();
        
    if (errorP || !prestamo) return res.status(404).json({ mensaje: 'Préstamo no encontrado' });

    // 3. Registrar el pago
    const { error: errorPago } = await supabase
        .from('pagos')
        .insert([{
            prestamo_id,
            cuota_id,
            monto_pagado
            // fecha_pago se asume por default en DB
        }]);
        
    if (errorPago) return res.status(500).json({ mensaje: 'Error al registrar el pago', detalle: errorPago.message });

    // 4. Actualizar estado de cuota (Lógica de pago parcial)
    const { data: pagosAnteriores } = await supabase
        .from('pagos')
        .select('monto_pagado')
        .eq('cuota_id', cuota_id);
        
    const yaPagado = (pagosAnteriores || []).reduce((acc, p) => acc + Number(p.monto_pagado), 0);
    // Nota: Como este pago recién se insertó arriba, yaPagado incluye este pago.
    
    let estado_cuota = 'pendiente';
    if (yaPagado >= Number(cuota.monto_cuota)) {
        estado_cuota = 'pagada';
    } else if (yaPagado > 0) {
        estado_cuota = 'parcial';
    }

    await supabase
        .from('cuotas')
        .update({ estado: estado_cuota })
        .eq('id', cuota_id);

    // 5. Recalcular saldo y actualizar préstamo
    // Asegurarse de que el monto pagado no exceda el saldo pendiente logicamente si es necesario, 
    // pero acá asumimos que el pago es igual a la cuota, por simplicidad:
    const nuevo_saldo = Number(prestamo.saldo_pendiente) - Number(monto_pagado);
    
    // Cambiar estado a pagado si llega a 0
    const nuevo_estado = nuevo_saldo <= 0 ? 'pagado' : 'activo'; 

    await supabase
        .from('prestamos')
        .update({ 
            saldo_pendiente: nuevo_saldo,
            estado: nuevo_estado 
        })
        .eq('id', prestamo_id);

    return res.status(201).json({ 
        mensaje: 'Pago registrado con éxito',
        nuevo_saldo, 
        estado_prestamo: nuevo_estado 
    });

  } catch (err) {
    return res.status(500).json({ mensaje: 'Error interno del servidor', detalle: err.message });
  }
};

// Ver historial de pagos de un préstamo (GET /pagos/prestamo/:prestamo_id)
export const obtenerPagosDePrestamo = async (req, res) => {
  try {
    const { prestamo_id } = req.params;

    const { data: pagos, error } = await supabase
      .from('pagos')
      .select(`
          *,
          cuotas (numero_cuota, monto_cuota)
      `)
      .eq('prestamo_id', prestamo_id)
      .order('fecha_pago', { ascending: false });

    if (error) {
      return res.status(500).json({ mensaje: 'Error al obtener el historial de pagos', detalle: error.message });
    }

    return res.status(200).json({ pagos });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error interno del servidor', detalle: err.message });
  }
};

// Procesar un pago en línea (POST /pagos/en-linea)
export const procesarPagoEnLinea = async (req, res) => {
  try {
    const { prestamo_id, cuota_id, monto_pagado } = req.body;

    if (!prestamo_id || !cuota_id || !monto_pagado) {
        return res.status(400).json({ mensaje: 'Faltan parámetros (prestamo_id, cuota_id o monto_pagado)' });
    }

    // El ID del auth.users viene en req.user (gracias a verificarToken)
    const authLayerId = req.user.id;

    // 1. Obtener el cliente_id asociado a este usuario (por seguridad)
    const { data: cliente, error: errCliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('usuario_id', authLayerId)
      .single();

    if (errCliente || !cliente) {
      return res.status(403).json({ mensaje: 'No tienes un perfil de cliente asociado para realizar pagos.' });
    }

    // 2. Validar que el préstamo pertenezca al cliente
    const { data: prestamo, error: errorP } = await supabase
      .from('prestamos')
      .select('id, saldo_pendiente, estado')
      .eq('id', prestamo_id)
      .eq('cliente_id', cliente.id)
      .single();

    if (errorP || !prestamo) {
      return res.status(403).json({ mensaje: 'El préstamo no pertenece a tu perfil o no existe.' });
    }

    // 3. Validar cuota, que no esté pagada y corresponda al préstamo
    const { data: cuota, error: errorC } = await supabase
      .from('cuotas')
      .select('*')
      .eq('id', cuota_id)
      .single();

    if (errorC || !cuota) return res.status(404).json({ mensaje: 'Cuota no encontrada' });
    if (cuota.estado === 'pagada') return res.status(400).json({ mensaje: 'Esta cuota ya se encuentra pagada' });
    if (cuota.prestamo_id !== prestamo_id) return res.status(400).json({ mensaje: 'La cuota no pertenece a este préstamo' });

    // 4. Registrar el pago (Metodo de pago especifico para online)
    const { error: errorPago } = await supabase
      .from('pagos')
      .insert([{
          prestamo_id,
          cuota_id,
          monto_pagado,
          metodo_pago: 'Tarjeta Crédito / En línea',
          registrado_por: authLayerId // Dejamos constancia de quién lo hizo (el mismo cliente)
      }]);
        
    if (errorPago) return res.status(500).json({ mensaje: 'Error al procesar el pago con tarjeta', detalle: errorPago.message });

    // 5. Actualizar estado de cuota
    const { data: pagosAnteriores } = await supabase
        .from('pagos')
        .select('monto_pagado')
        .eq('cuota_id', cuota_id);
        
    const yaPagado = (pagosAnteriores || []).reduce((acc, p) => acc + Number(p.monto_pagado), 0);
    
    let estado_cuota = 'pendiente';
    if (yaPagado >= Number(cuota.monto_cuota)) {
        estado_cuota = 'pagada';
    } else if (yaPagado > 0) {
        estado_cuota = 'parcial';
    }

    await supabase
        .from('cuotas')
        .update({ estado: estado_cuota })
        .eq('id', cuota_id);

    // 6. Recalcular saldo y actualizar préstamo
    const nuevo_saldo = Number(prestamo.saldo_pendiente) - Number(monto_pagado);
    const nuevo_estado = nuevo_saldo <= 0 ? 'pagado' : 'activo'; 

    await supabase
        .from('prestamos')
        .update({ 
            saldo_pendiente: nuevo_saldo,
            estado: nuevo_estado 
        })
        .eq('id', prestamo_id);

    return res.status(201).json({ 
        mensaje: 'Pago en línea procesado exitosamente',
        nuevo_saldo, 
        estado_prestamo: nuevo_estado 
    });

  } catch (err) {
    return res.status(500).json({ mensaje: 'Error interno del servidor', detalle: err.message });
  }
};
