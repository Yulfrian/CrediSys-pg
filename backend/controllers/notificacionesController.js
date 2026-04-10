import { supabase } from '../config/supabaseClient.js';

// Crear notificación (POST /notificaciones)
export const crearNotificacion = async (req, res) => {
  try {
    const { cliente_id, mensaje } = req.body;

    if (!cliente_id || !mensaje) {
      return res.status(400).json({ mensaje: 'Cliente ID y mensaje son requeridos' });
    }

    const { data, error } = await supabase
      .from('notificaciones')
      .insert([{ cliente_id, mensaje }])
      .select()
      .single();

    if (error) return res.status(500).json({ mensaje: 'Error al guardar notificación', detalle: error.message });

    return res.status(201).json({ notificacion: data });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error interno', detalle: err.message });
  }
};

export const obtenerNotificaciones = async (req, res) => {
    try {
        const usuario_id = req.user.id;
        const rol = req.user.rol;

        let query = supabase
            .from('notificaciones')
            .select('*')
            .order('fecha_envio', { ascending: false })
            .limit(20);

        // Si es cliente, solo ve las suyas. Si es administrador, ve las generales (usuario_id null)
        if (rol === 'cliente') {
            query = query.eq('usuario_id', usuario_id);
        } else {
            query = query.is('usuario_id', null);
        }

        const { data, error } = await query;

        if (error) return res.status(500).json({ mensaje: 'Error al obtener notificaciones', detalle: error.message });

        return res.status(200).json({ notificaciones: data });
    } catch (err) {
        return res.status(500).json({ mensaje: 'Error interno', detalle: err.message });
    }
};

// Marcar como leída (PUT /notificaciones/:id/leer)
export const marcarLeida = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('id', id);

        if (error) return res.status(500).json({ mensaje: 'Error al actualizar notificación', detalle: error.message });

        return res.status(200).json({ mensaje: 'Notificación marcada como leída' });
    } catch (err) {
        return res.status(500).json({ mensaje: 'Error interno', detalle: err.message });
    }
};
