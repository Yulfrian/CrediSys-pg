import express from 'express';
import { registrarDocumento, obtenerDocumentosCliente, eliminarDocumento } from '../controllers/documentosController.js';
import { verificarToken } from '../middleware/authMiddleware.js';
import { autorizarRol } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(verificarToken);

router.post('/', autorizarRol(['administrador', 'cajero']), registrarDocumento);
router.get('/cliente/:cliente_id', autorizarRol(['administrador', 'cajero']), obtenerDocumentosCliente);
router.delete('/:id', autorizarRol(['administrador']), eliminarDocumento);

export default router;
