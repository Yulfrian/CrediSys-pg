import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function seedAdmin() {
    console.log("Intentando crear usuario mediante admin bypass...");
    
    // 1. Emplear supabase.auth.signUp para que el trigger lo agarre
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'admin@credisys.com',
        password: 'password123',
        options: {
            data: {
                nombre: 'Administrador Principal',
                rol: 'administrador'
            }
        }
    });

    if (authError) {
        console.error("Error al crear admin en Auth:", authError);
        return;
    }
    
    console.log("Usuario admin creado exitosamente en Auth:", authData.user.id);
    console.log("Credenciales -> admin@credisys.com / password123");
    
    console.log("--- PROCESO TERMINADO ---");
}

seedAdmin();
