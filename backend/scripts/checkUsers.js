import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
    console.log("Buscando usuarios registrados en Supabase...");
    const { data, error } = await supabase.from('usuarios').select('*');
    if (error) {
        console.error("ERROR:", error.message);
    } else {
        console.log("USUARIOS ENCONTRADOS:");
        console.log(JSON.stringify(data, null, 2));
    }
}

run();
