import express from 'express';
import { registrarPago, obtenerPagosDePrestamo, procesarPagoEnLinea } from '../controllers/pagosController.js';
import { verificarToken } from '../middleware/authMiddleware.js';
import { autorizarRol } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verificarToken);

// Registrar pago (Cajero, Administrador)
router.post('/', autorizarRol(['administrador', 'cajero']), registrarPago);

// Pago en línea (Cliente)
router.post('/en-linea', autorizarRol(['cliente']), procesarPagoEnLinea);

// Ver historial de pagos de un préstamo (Admin, Cajero)
router.get('/prestamo/:prestamo_id', autorizarRol(['administrador', 'cajero']), obtenerPagosDePrestamo);

export default router;
