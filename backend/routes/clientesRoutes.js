import express from 'express';
import {
  crearCliente,
  obtenerClientes,
  obtenerClientePorId,
  actualizarCliente,
  eliminarCliente
} from '../controllers/clientesController.js';

import { verificarToken } from '../middleware/authMiddleware.js';
import { autorizarRol } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Todas las rutas de clientes requieren estar autenticado
router.use(verificarToken);

// Crear un nuevo cliente (Solo Administrador)
router.post('/', autorizarRol(['administrador']), crearCliente);

// Listar todos los clientes (Admin, Cajero)
router.get('/', autorizarRol(['administrador', 'cajero']), obtenerClientes);

// Ver información de un cliente (Admin, Cajero)
router.get('/:id', autorizarRol(['administrador', 'cajero']), obtenerClientePorId);

// Actualizar datos del cliente (Solo Administrador)
router.put('/:id', autorizarRol(['administrador']), actualizarCliente);

// Eliminar un cliente (Solo Administrador)
router.delete('/:id', autorizarRol(['administrador']), eliminarCliente);

export default router;
