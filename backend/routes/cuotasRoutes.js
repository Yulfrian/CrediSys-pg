import express from 'express';
import { obtenerCuotasDePrestamo } from '../controllers/cuotasController.js';
import { verificarToken } from '../middleware/authMiddleware.js';
import { autorizarRol } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verificarToken);

// Ver cronograma de pagos (Admin, Cajero, Cliente)
router.get('/prestamo/:prestamo_id', autorizarRol(['administrador', 'cajero', 'cliente']), obtenerCuotasDePrestamo);

export default router;
