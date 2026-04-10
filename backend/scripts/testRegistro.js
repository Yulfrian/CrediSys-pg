import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
    console.log("Probando registro en Supabase Auth directamente...");
    const { data, error } = await supabase.auth.signUp({
        email: 'julfrianelgordito@gmail.com',
        password: 'PasswordSeguro123!',
        options: { data: { nombre: 'Julfrian', rol: 'administrador' } }
    });

    if (error) {
        console.error("\n=================");
        console.error("ERROR DEVUELTO POR SUPABASE:");
        console.error("Mensaje exacto:", error.message);
        console.error("Código de error:", error.code);
        console.error("Status HTTP:", error.status);
        console.error("=================\n");
    } else {
        console.log("REGISTRO EXITOSO:", data.user ? data.user.id : 'Sin ID (requiere confirmación)');
    }
}

run();
