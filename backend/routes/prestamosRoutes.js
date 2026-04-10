import express from 'express';
import {
  crearPrestamo,
  obtenerPrestamos,
  obtenerPrestamoPorId,
  obtenerPrestamosDeCliente,
  obtenerMisPrestamos,
  eliminarPrestamo
} from '../controllers/prestamosController.js';

import { verificarToken } from '../middleware/authMiddleware.js';
import { autorizarRol } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verificarToken);

// Crear préstamo nuevo (Solo Admin)
router.post('/', autorizarRol(['administrador']), crearPrestamo);

// Listar préstamos (Admin, Cajero)
router.get('/', autorizarRol(['administrador', 'cajero']), obtenerPrestamos);

// Ruta Exclusiva de Cliente: Ver sus propios préstamos
router.get('/mi-portal', autorizarRol(['cliente']), obtenerMisPrestamos);

// Ver detalles (Admin, Cajero)
router.get('/:id', autorizarRol(['administrador', 'cajero']), obtenerPrestamoPorId);

// Ver préstamos de un cliente (Admin, Cajero)
router.get('/cliente/:cliente_id', autorizarRol(['administrador', 'cajero']), obtenerPrestamosDeCliente);

// Eliminar préstamo (Solo Administrador)
router.delete('/:id', autorizarRol(['administrador']), eliminarPrestamo);

export default router;
