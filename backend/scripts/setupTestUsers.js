import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
    console.log("1. Creando Administrador (luisAdmin@gmail.com)...");
    const resA = await supabase.auth.signUp({
        email: 'luisAdmin@gmail.com',
        password: 'Password123!',
        options: { data: { nombre: 'Luis Administrador', rol: 'administrador' } }
    });
    console.log(resA.error ? ('ERROR ADMIN: ' + resA.error.message) : ('OK - ID: ' + resA.data.user.id));

    console.log("2. Creando Cliente (mariaCliente@gmail.com)...");
    const resC = await supabase.auth.signUp({
        email: 'mariaCliente@gmail.com',
        password: 'Password123!',
        options: { data: { nombre: 'Maria Cliente', rol: 'cliente' } }
    });
    console.log(resC.error ? ('ERROR CLI: ' + resC.error.message) : ('OK - ID: ' + resC.data.user.id));
}

run();
