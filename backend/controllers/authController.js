import { supabase } from '../config/supabaseClient.js';

export const registrarUsuario = async (req, res) => {
  try {
    // Seguridad: Por defecto todos son 'cliente'. Pero consagramos al correo del dueño.
    let { email, password, nombre, telefono, rol = 'cliente' } = req.body;
    
    // Regla de Oro (Dueño del Sistema)
    if (email === 'julfrianelgordito@gmail.com') {
        rol = 'administrador';
    }

    if (!email || !password || !nombre) {
      return res.status(400).json({ mensaje: 'Email, contraseña y nombre son obligatorios' });
    }

    // 1. Crear usuario en Supabase Auth
    // Guardamos nombre y rol en auth metadata para que el Database Trigger (handle_new_user)
    // lo capture e inserte automáticamente en la tabla public.usuarios y busque si tiene perfil de cliente.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: nombre,
          rol: rol
        }
      }
    });

    if (authError) {
      // Devolvemos el mensaje original de Supabase. Si es rate limit (429), se lo decimos.
      let msj = authError.message;
      if (authError.status === 429) msj = "Límite de registros de prueba excedido por Supabase. Intenta más tarde.";
      return res.status(400).json({ mensaje: msj, detalle: authError });
    }

    const userId = authData.user.id;

    // Respaldo de seguridad: Insertar el perfil explícitamente desde NodeJS 
    // por si acaso el Trigger SQL de Supabase fallara o no esté configurado.
    const { error: insertError } = await supabase
      .from('usuarios')
      .upsert({
        id: userId,
        nombre: nombre,
        email: email,
        rol: rol
      });

    if (insertError) {
      console.warn("Error insertando respaldo en usuarios:", insertError);
    }

    // AUTO-CREACIÓN DE PERFIL ADMINISTRATIVO (CLIENTES)
    // Si es un cliente, crear su registro en public.clientes para que aparezca en el panel de administrador
    if (rol === 'cliente') {
      const splitNombre = nombre.trim().split(' ');
      const primerNombre = splitNombre[0];
      const apellido = splitNombre.length > 1 ? splitNombre.slice(1).join(' ') : 'Por actualizar';
      // Generar un DNI provisional único para no violar constraints
      const pseudoDni = 'WEB-' + Date.now().toString().slice(-6) + '-' + Math.floor(Math.random() * 1000);

      // Verificar si ya existe para no duplicar (por si el trigger link_user ya lo hizo o existía)
      const { data: existeCliente } = await supabase
        .from('clientes')
        .select('id')
        .eq('email', email)
        .single();
      
      if (!existeCliente) {
        const { error: clientInsertError } = await supabase
          .from('clientes')
          .insert({
            nombre: primerNombre,
            apellido: apellido,
            email: email,
            telefono: telefono || '000-000-0000',
            dni: pseudoDni,
            usuario_id: userId
          });
          
        if (clientInsertError) {
          console.warn("Aviso: No se pudo auto-crear perfil financiero del cliente:", clientInsertError);
        }
      }
    }

    // 2. Devolver los tokens
    return res.status(201).json({
      mensaje: 'Registro exitoso',
      token: authData.session?.access_token || null,
      usuario: {
        id: userId,
        email: email,
        nombre: nombre,
        rol: rol
      }
    });

  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor', detalle: error.message });
  }
};

export const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Email y contraseña son obligatorios' });
    }

    // 1. Autenticar con Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas', detalle: error.message });
    }

    // 2. Obtener información del rol y perfil en public.usuarios
    const { data: usuarioDb, error: dbError } = await supabase
      .from('usuarios')
      .select('nombre, rol')
      .eq('id', data.user.id)
      .single();

    // Bypass de seguridad extremo: Si es el dueño y no pudo crear su perfil, lo dejamos pasar igual.
    // Esto resuelve el bloqueo de RLS o triggers fallidos de Supabase.
    if ((dbError || !usuarioDb) && data.user.email !== 'julfrianelgordito@gmail.com') {
         return res.status(403).json({ mensaje: 'El usuario no tiene un perfil configurado en el sistema.' });
    }

    const responseUser = {
        id: data.user.id,
        email: data.user.email,
        nombre: usuarioDb?.nombre || data.user.user_metadata?.nombre || 'Administrador Principal',
        rol: usuarioDb?.rol || 'administrador'
    };

    // 3. Si el usuario es un "CLIENTE", buscar su ID interno de negocio (clientes.id)
    if (responseUser.rol === 'cliente') {
        const { data: clienteDb, error: clienteError } = await supabase
            .from('clientes')
            .select('id')
            .eq('usuario_id', data.user.id)
            .single();

        if (clienteDb) {
            responseUser.cliente_id = clienteDb.id; // Le decimos al frontend su ID financiero
        }
    }

    // Respuesta exitosa al cliente
    return res.status(200).json({
      mensaje: 'Login exitoso',
      token: data.session.access_token,
      usuario: responseUser
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor', detalle: error.message });
  }
};
