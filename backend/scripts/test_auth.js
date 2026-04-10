import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function testRegistration() {
    console.log("1. Probando crear un usuario en Supabase Auth...");
    const testEmail = `test_${Date.now()}@credisys.com`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'Password123!',
        options: {
            data: {
                nombre: 'Usuario de Prueba',
                telefono: '809-123-4567'
            }
        }
    });

    if (authError) {
        console.error("ERROR EN SUPABASE AUTH:", authError);
        return;
    }

    console.log("Usuario de Auth creado con éxito. ID:", authData.user?.id);
    console.log("Sesión disponible?:", !!authData.session);

    if (!authData.user) {
        console.log("No se devolvió un usuario.");
        return;
    }

    console.log("2. Insertando usuario en la tabla 'usuarios'...");
    const { error: dbError } = await supabase
        .from('usuarios')
        .insert([{
            id: authData.user.id,
            nombre: 'Usuario de Prueba',
            email: testEmail,
            telefono: '809-123-4567',
            rol: 'prestamista'
        }]);

    if (dbError) {
        console.error("ERROR AL INSERTAR EN LA TABLA 'usuarios':", dbError);
    } else {
        console.log("Usuario insertado en la tabla 'usuarios' con éxito.");
    }
    
    console.log("3. Intentando Iniciar Sesión...");
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: 'Password123!'
    });
    
    if (loginError) {
         console.error("ERROR EN LOGIN DE SUPABASE:", loginError);
    } else {
         console.log("Login exitoso en Supabase Auth.");
    }
}

testRegistration();
