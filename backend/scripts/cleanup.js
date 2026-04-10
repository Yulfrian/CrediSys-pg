import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan credenciales de Supabase en .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const cleanup = async () => {
  console.log('--- Iniciando Limpieza de Datos (Nivel 2) ---');

  // El orden de las tablas es crucial debido a las llaves foráneas.
  const tables = [
    'pagos',
    'cuotas',
    'solicitudes_prestamo',
    'documentos',
    'notificaciones',
    'prestamos',
    'clientes'
  ];

  for (const table of tables) {
    console.log(`Borrando registros de la tabla: ${table}...`);
    const { error, count } = await supabase
      .from(table)
      .delete()
      .neq('id', -1); // Un truco para borrar todo el contenido si RLS lo permite

    if (error) {
      console.error(`Error al borrar en ${table}:`, error.message);
    } else {
      console.log(`Tabla ${table} limpiada.`);
    }
  }

  console.log('--- Limpieza Finalizada ---');
};

cleanup();
