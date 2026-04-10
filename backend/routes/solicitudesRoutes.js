import express from 'express';
import {
  crearSolicitud,
  obtenerSolicitudes,
  obtenerMisSolicitudes,
  cambiarEstadoSolicitud
} from '../controllers/solicitudesController.js';

import { verificarToken } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { crearSolicitudSchema, cambiarEstadoSchema } from '../validation/schemas.js';
import { autorizarRol } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verificarToken);

// Clientes piden préstamos
router.post('/mi-portal', autorizarRol(['cliente']), validate(crearSolicitudSchema), crearSolicitud);
router.get('/mi-portal', autorizarRol(['cliente']), obtenerMisSolicitudes);

// Admin gestiona préstamos
router.get('/', autorizarRol(['administrador', 'cajero']), obtenerSolicitudes);
router.put('/:id/estado', autorizarRol(['administrador']), validate(cambiarEstadoSchema), cambiarEstadoSolicitud);

export default router;
