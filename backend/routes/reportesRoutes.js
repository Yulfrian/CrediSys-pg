import express from 'express';
import {
    reportePrestamosActivos,
    reporteClientesMorosos,
    reporteGanancias,
    reporteCapitalPrestado
} from '../controllers/reportesController.js';

import { verificarToken } from '../middleware/authMiddleware.js';
import { autorizarRol } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verificarToken);
// Todos los reportes son de acceso exclusivo para administrador
router.use(autorizarRol(['administrador']));

router.get('/prestamos-activos', reportePrestamosActivos);
router.get('/clientes-morosos', reporteClientesMorosos);
router.get('/ganancias', reporteGanancias);
router.get('/capital-prestado', reporteCapitalPrestado);

export default router;
