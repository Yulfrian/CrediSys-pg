-- ==============================================================================
-- CrediSys - Base de Datos en Supabase (PostgreSQL)
-- Copia y ejecuta este script completo en el SQL Editor de tu proyecto Supabase.
-- ==============================================================================

-- 1. Tabla de Usuarios (Sistema Login / Empleados / Cuentas de Clientes en web)
-- Se vincula a auth.users (la tabla interna de contraseñas de Supabase)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefono TEXT,
    rol VARCHAR(20) DEFAULT 'cliente' CHECK (rol IN ('administrador', 'cliente')),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Clientes (Perfil del Deudor)
-- usuario_id es opcional. Solo los clientes que se registran para ver su portal lo tendrán.
CREATE TABLE IF NOT EXISTS public.clientes (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    dni TEXT UNIQUE NOT NULL,
    telefono TEXT NOT NULL,
    email TEXT UNIQUE,
    direccion TEXT,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL, -- Vínculo al portal web
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Préstamos
CREATE TABLE IF NOT EXISTS public.prestamos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES public.clientes(id) ON DELETE RESTRICT NOT NULL,
    monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
    tasa_interes NUMERIC(5, 4) NOT NULL CHECK (tasa_interes >= 0),
    plazo_meses INTEGER NOT NULL CHECK (plazo_meses > 0),
    fecha_inicio DATE NOT NULL,
    total_a_pagar NUMERIC(12, 2) NOT NULL,
    cuota_mensual NUMERIC(12, 2) NOT NULL,
    saldo_pendiente NUMERIC(12, 2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'saldado', 'atrasado', 'castigado')),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla de Cuotas (Plan de Amortización)
CREATE TABLE IF NOT EXISTS public.cuotas (
    id SERIAL PRIMARY KEY,
    prestamo_id INTEGER REFERENCES public.prestamos(id) ON DELETE CASCADE NOT NULL,
    numero_cuota INTEGER NOT NULL CHECK (numero_cuota > 0),
    monto_cuota NUMERIC(12, 2) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagada', 'parcial', 'vencida')),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (prestamo_id, numero_cuota) -- Evita duplicar la "cuota 1" de un mismo préstamo
);

-- 5. Tabla de Pagos (Recibos / Transacciones)
CREATE TABLE IF NOT EXISTS public.pagos (
    id SERIAL PRIMARY KEY,
    prestamo_id INTEGER REFERENCES public.prestamos(id) ON DELETE RESTRICT NOT NULL,
    cuota_id INTEGER REFERENCES public.cuotas(id) ON DELETE RESTRICT, -- Puede ser null si es un pago a capital
    monto_pagado NUMERIC(12, 2) NOT NULL CHECK (monto_pagado > 0),
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
    referencia TEXT,
    fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    registrado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL -- Quién registró el pago (empleado o el mismo cliente online)
);

-- 6. Tabla de Documentos
CREATE TABLE IF NOT EXISTS public.documentos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
    prestamo_id INTEGER REFERENCES public.prestamos(id) ON DELETE CASCADE, -- Opcional
    tipo_documento VARCHAR(100) NOT NULL,
    nombre_archivo TEXT NOT NULL,
    url_archivo TEXT NOT NULL,
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabla de Notificaciones
CREATE TABLE IF NOT EXISTS public.notificaciones (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES public.clientes(id) ON DELETE CASCADE, -- Si es para el cliente
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE, -- Si es para el administrador
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'info',
    leida BOOLEAN DEFAULT false,
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- TRIGGERS Y FUNCIONES AUTOMÁTICAS (Lógica Fuerte de Base de Datos)
-- ==============================================================================

-- Trigger: Automatizar la creación de perfiles públicos desde auth.users
-- Cada vez que alguien se registra en la pantalla Auth de Supabase (Login screen), 
-- se inserta una copia en la tabla 'usuarios'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, nombre, email, rol)
  VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario Nuevo'), 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'rol', 'cliente')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger: Enlace automático entre "usuario" nuevo y "cliente" existente
-- Si un "cliente" se registra online, buscaremos si el administrador ya le había 
-- creado una fila en /clientes con el mismo email, para enlazar las cuentas al instante.
CREATE OR REPLACE FUNCTION public.link_user_to_client()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rol = 'cliente' THEN
    UPDATE public.clientes 
    SET usuario_id = NEW.id 
    WHERE email = NEW.email AND usuario_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_link_client ON public.usuarios;
CREATE TRIGGER auto_link_client
  AFTER INSERT ON public.usuarios
  FOR EACH ROW EXECUTE PROCEDURE public.link_user_to_client();

-- NOTA: Como regla de seguridad RLS de Supabase, puedes activar Row Level Security (RLS) 
-- y hacer que SELECT * FROM prestamos solo muestre resultados donde 
-- cliente_id = (SELECT id FROM clientes WHERE usuario_id = auth.uid()) OR (rol_actual() = 'administrador')
-- (Para este caso configuraremos la seguridad vía Backend Nodejs).

-- 8. Tabla de Solicitudes de Préstamo (Portal Web)
CREATE TABLE IF NOT EXISTS public.solicitudes_prestamo (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
    monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
    plazo_meses INTEGER NOT NULL CHECK (plazo_meses > 0),
    motivo TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
