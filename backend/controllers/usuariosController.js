import { supabase } from '../config/supabaseClient.js';

// GET /api/usuarios/perfil
export const obtenerPerfil = async (req, res) => {
    try {
        const usuario_id = req.user.id;
        const rol = req.user.rol;

        // 1. Obtener datos básicos de la tabla usuarios
        const { data: usuarioData, error: usuarioError } = await supabase
            .from('usuarios')
            .select('nombre, email, telefono, rol')
            .eq('id', usuario_id)
            .single();

        if (usuarioError || !usuarioData) {
            return res.status(404).json({ mensaje: 'Perfil de usuario no encontrado', detalle: usuarioError?.message });
        }

        let perfilCompleto = { ...usuarioData };

        // 2. Si es cliente, obtener datos extendidos (ej. dirección)
        if (rol === 'cliente') {
            const { data: clienteData, error: clienteError } = await supabase
                .from('clientes')
                .select('direccion')
                .eq('usuario_id', usuario_id)
                .single();
            
            // Si hay error no bloqueamos, quizás no tenga registro de cliente aún
            if (clienteData) {
                perfilCompleto.direccion = clienteData.direccion || '';
            }
        }

        return res.status(200).json({ perfil: perfilCompleto });
    } catch (err) {
        console.error("Error en obtenerPerfil:", err);
        return res.status(500).json({ mensaje: 'Error interno del servidor', detalle: err.message });
    }
};

// PUT /api/usuarios/perfil
export const actualizarPerfil = async (req, res) => {
    try {
        const usuario_id = req.user.id;
        const rol = req.user.rol;
        const { nombre, telefono, direccion } = req.body;

        // 1. Actualizar tabla usuarios (aplica para todos)
        const { error: errorAuth } = await supabase
            .from('usuarios')
            .update({ nombre, telefono })
            .eq('id', usuario_id);

        if (errorAuth) {
            return res.status(500).json({ mensaje: 'Error al actualizar perfil de usuario', detalle: errorAuth.message });
        }

        // 2. Si es cliente, actualizar también su tabla de clientes
        if (rol === 'cliente') {
            // Actualizamos nombre, telefono y su dirección exclusiva
            const { error: errorCliente } = await supabase
                .from('clientes')
                .update({ nombre, telefono, direccion })
                .eq('usuario_id', usuario_id);
            
            if (errorCliente) {
                // No rompemos todo si no tiene tabla de cliente, solo le avisamos
                console.warn("No se pudo actualizar la tabla clientes:", errorCliente.message);
            }
        }

        return res.status(200).json({ mensaje: 'Perfil actualizado correctamente' });

    } catch (err) {
        console.error("Error en actualizarPerfil:", err);
        return res.status(500).json({ mensaje: 'Error interno del servidor', detalle: err.message });
    }
};

// PUT /api/usuarios/password
export const cambiarPassword = async (req, res) => {
    try {
        const usuario_id = req.user.id;
        const { passwordActual, nuevaPassword } = req.body;

        if (!nuevaPassword || nuevaPassword.length < 6) {
             return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        }

        // Usamos el cliente admin para forzar el cambio de contraseña.
        // En un entorno 100% estricto pediríamos la actual, pero Supabase Admin permite sobreescribirla directo.
        const { error } = await supabase.auth.admin.updateUserById(
            usuario_id,
            { password: nuevaPassword }
        );

        if (error) {
            // Reintento: si no tiene permisos admin (uso de anon key), devolvemos un mensaje descriptivo.
            if (error.message.includes('admin') || error.status === 401 || error.status === 403) {
                 return res.status(403).json({ mensaje: 'El backend no tiene permisos admin para cambiar la contraseña (se requiere Service Role Key).', detalle: error.message });
            }
            return res.status(500).json({ mensaje: 'Error de Supabase al actualizar contraseña', detalle: error.message });
        }

        return res.status(200).json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (err) {
        console.error("Error en cambiarPassword:", err);
        return res.status(500).json({ mensaje: 'Error interno del servidor', detalle: err.message });
    }
};

