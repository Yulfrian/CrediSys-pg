import express from 'express';
import { crearNotificacion, obtenerNotificaciones, marcarLeida } from '../controllers/notificacionesController.js';
import { verificarToken } from '../middleware/authMiddleware.js';
import { autorizarRol } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verificarToken);

// Solo admin puede crear notificaciones o recordatorios base
router.post('/', autorizarRol(['administrador']), crearNotificacion);

// Ambos pueden verlas
router.get('/', obtenerNotificaciones); // Remuevo autorizarRol cajero porque no existe, y cliente debe ver sus notifs

// Marcar como leída
router.put('/:id/leer', marcarLeida);

export default router;
