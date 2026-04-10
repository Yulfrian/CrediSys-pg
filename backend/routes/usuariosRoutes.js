import express from 'express';
import { obtenerPerfil, actualizarPerfil, cambiarPassword } from '../controllers/usuariosController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verificarToken);

// Rutas de configuración de perfil
router.get('/perfil', obtenerPerfil);
router.put('/perfil', actualizarPerfil);
router.put('/password', cambiarPassword);

export default router;
