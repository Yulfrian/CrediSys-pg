import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function testRoleConstraint() {
    console.log("Probando insertar un usuario sin telefono...");
    
    const { data, error } = await supabase.from('usuarios').insert([{
        nombre: 'Prueba Sin Telefono',
        email: `prueba_${Date.now()}@credisys.com`,
        rol: 'administrador'
    }]).select();
    
    if (error) {
        console.error("ERROR DE INSERCIÓN:", error);
    } else {
        console.log("Inserción exitosa:", data);
        
        // Limpiamos el de prueba
        await supabase.from('usuarios').delete().eq('id', data[0].id);
    }
}

testRoleConstraint();
