import { supabase } from '../config/supabaseClient.js';

// Crear un nuevo cliente (POST /clientes)
export const crearCliente = async (req, res) => {
  try {
    const { nombre, apellido, dni, telefono, email, direccion } = req.body;

    if (!nombre || !apellido || !dni) {
      return res.status(400).json({ mensaje: 'Nombre, apellido y DNI son requeridos' });
    }

    const { data, error } = await supabase
      .from('clientes')
      .insert([{ nombre, apellido, dni, telefono, email, direccion }])
      .select()
      .single();

    if (error) {
        // Manejar error de DNI duplicado, que en Postgresuele ser código 23505
        if (error.code === '23505') {
            return res.status(409).json({ mensaje: 'El DNI o Email ya se encuentra registrado' });
        }
        return res.status(500).json({ mensaje: 'Error al registrar cliente', detalle: error.message });
    }

    return res.status(201).json({ mensaje: 'Cliente creado exitosamente', cliente: data });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error en el servidor', detalle: err.message });
  }
};

// Listar todos los clientes (GET /clientes)
export const obtenerClientes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('fecha_registro', { ascending: false });

    if (error) return res.status(500).json({ mensaje: 'Error al obtener clientes', detalle: error.message });

    return res.status(200).json({ clientes: data });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error en el servidor', detalle: err.message });
  }
};

// Ver información de un cliente (GET /clientes/:id)
export const obtenerClientePorId = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
        return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    return res.status(200).json({ cliente: data });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error en el servidor', detalle: err.message });
  }
};

// Actualizar datos del cliente (PUT /clientes/:id)
export const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, telefono, email, direccion } = req.body;

    const { data, error } = await supabase
      .from('clientes')
      .update({ nombre, apellido, telefono, email, direccion })
      .eq('id', id)
      .select()
      .single();

    if (error) {
        return res.status(500).json({ mensaje: 'Error al actualizar cliente', detalle: error.message });
    }
    
    if (!data) {
        return res.status(404).json({ mensaje: 'Cliente no encontrado o no hubieron cambios' });
    }

    return res.status(200).json({ mensaje: 'Cliente actualizado', cliente: data });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error en el servidor', detalle: err.message });
  }
};

// Eliminar un cliente en cascada (DELETE /clientes/:id)
export const eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Obtener los préstamos de este cliente
    const { data: prestamos } = await supabase.from('prestamos').select('id').eq('cliente_id', id);
    const prestamoIds = prestamos?.map(p => p.id) || [];

    // 2. Si tiene préstamos, eliminar sus dependencias
    if (prestamoIds.length > 0) {
       await supabase.from('pagos').delete().in('prestamo_id', prestamoIds);
       await supabase.from('cuotas').delete().in('prestamo_id', prestamoIds);
       await supabase.from('documentos').delete().in('prestamo_id', prestamoIds);
       
       // Eliminar los préstamos
       await supabase.from('prestamos').delete().in('id', prestamoIds);
    }
    
    // 2.5 Eliminar otras dependencias directas del cliente
    await supabase.from('solicitudes_prestamo').delete().eq('cliente_id', id);
    await supabase.from('documentos').delete().eq('cliente_id', id);
    await supabase.from('notificaciones').delete().eq('cliente_id', id);

    // 3. Eliminar el cliente
    const { error: errorCliente } = await supabase.from('clientes').delete().eq('id', id);
    
    if (errorCliente) {
       return res.status(500).json({ mensaje: 'Error al eliminar cliente', detalle: errorCliente.message });
    }

    return res.status(200).json({ mensaje: 'Cliente y sus datos asociados eliminados exitosamente' });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error en el servidor', detalle: err.message });
  }
};
