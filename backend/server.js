import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

// Rutas
import authRoutes from './routes/authRoutes.js';
import usuariosRoutes from './routes/usuariosRoutes.js';
import clientesRoutes from './routes/clientesRoutes.js';
import prestamosRoutes from './routes/prestamosRoutes.js';
import cuotasRoutes from './routes/cuotasRoutes.js';
import pagosRoutes from './routes/pagosRoutes.js';
import reportesRoutes from './routes/reportesRoutes.js';
import documentosRoutes from './routes/documentosRoutes.js';
import notificacionesRoutes from './routes/notificacionesRoutes.js';
import solicitudesRoutes from './routes/solicitudesRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares Globales
app.use(cors());
app.use(express.json());

// Registro de Rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/prestamos', prestamosRoutes);
app.use('/api/cuotas', cuotasRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/solicitudes', solicitudesRoutes);

// Ruta Base (Health Check)
app.get('/', (req, res) => {
  res.json({ mensaje: 'API de CrediSys funcionando correctamente', version: '1.0.0' });
});

// Middleware Global de Manejo de Errores (básico)
import { errorHandler } from './middleware/errorHandler.js';

// Middleware Global de Manejo de Errores (centralizado)
app.use(errorHandler);

// Condición para Vercel Serverless
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Servidor de CrediSys corriendo en http://localhost:${PORT}`);
  });
}

// Requerido por Vercel
export default app;
