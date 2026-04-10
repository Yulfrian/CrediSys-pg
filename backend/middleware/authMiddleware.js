import { supabase } from '../config/supabaseClient.js';

export const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ mensaje: 'No se proporcionó token de autenticación o formato inválido' });
    }

    const token = authHeader.split(' ')[1];

    // Verificar token con Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ mensaje: 'Token inválido o expirado', detalle: error?.message });
    }

    // Buscar el rol del usuario en la tabla pública de usuarios
    const { data: usuarioDb, error: dbError } = await supabase
      .from('usuarios')
      .select('rol, nombre')
      .eq('id', user.id)
      .single();

    // Bypass de seguridad extremo: permitimos al dueño saltar este paso
    if ((dbError || !usuarioDb) && user.email !== 'julfrianelgordito@gmail.com') {
      return res.status(401).json({ mensaje: 'Usuario no registrado en la base de datos de empleados' });
    }

    // Inyectar datos del usuario en la request para su uso posterior en los controladores
    req.user = {
      id: user.id,
      email: user.email,
      rol: usuarioDb?.rol || 'administrador',
      nombre: usuarioDb?.nombre || user.user_metadata?.nombre || 'Administrador Principal'
    };

    next();
  } catch (error) {
    console.error("Error en middleware de autenticación:", error);
    return res.status(500).json({ mensaje: 'Error interno en la autenticación' });
  }
};
