import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

function generateTestToken() {
    // Generate valid jwt using our secret
    const token = jwt.sign(
        { id: '12345678-1234-1234-1234-123456789012', email: 'admin@credisys.com', rol: 'administrador' },
        process.env.JWT_SECRET || 'secreto_super_seguro_development',
        { expiresIn: '1h' }
    );
    console.log("------------------------");
    console.log("TU TOKEN DE PRUEBA ES:");
    console.log(token);
    console.log("------------------------");
    console.log("USUARIO:");
    console.log(JSON.stringify({ id: '12345678-1234-1234-1234-123456789012', nombre: 'Test Admin', rol: 'administrador'}));
}

generateTestToken();
