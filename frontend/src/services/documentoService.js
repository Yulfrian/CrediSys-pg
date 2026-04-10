import api from './api';

export const documentoService = {
  obtenerDocumentosCliente: async (clienteId) => {
    const response = await api.get(`/documentos/cliente/${clienteId}`);
    return response.data;
  },

  registrarDocumento: async (documentoData) => {
    // documentoData: { cliente_id, nombre_archivo, url_archivo, tipo_documento }
    const response = await api.post('/documentos', documentoData);
    return response.data;
  },

  eliminarDocumento: async (id) => {
    const response = await api.delete(`/documentos/${id}`);
    return response.data;
  }
};
