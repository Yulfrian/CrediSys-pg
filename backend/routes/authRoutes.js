import express from 'express';
import { loginUsuario, registrarUsuario } from '../controllers/authController.js';

const router = express.Router();

// Endpoint público: Iniciar sesión
router.post('/login', loginUsuario);

// Endpoint público: Registro de usuario
router.post('/register', registrarUsuario);

export default router;
