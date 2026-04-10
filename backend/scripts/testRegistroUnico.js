import { supabase } from './config/supabaseClient.js';

async function test() {
    console.log("Probando registro...");
    const { data, error } = await supabase.auth.signUp({
      email: "prueba_fina@credisys.com",
      password: "password123",
      options: {
        data: {
          nombre: "Prueba Fina",
          rol: "cliente"
        }
      }
    });

    if (error) {
        console.error("ERROR DE REGISTRO:", error);
    } else {
        console.log("REGISTRO EXITOSO!");
        console.log("Session token existe?:", !!data.session);
    }
}
test();
