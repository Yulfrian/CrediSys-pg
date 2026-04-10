import api from './api';

export const prestamoService = {
  obtenerPrestamos: async () => {
    const response = await api.get('/prestamos');
    return response.data;
  },
  
  obtenerPrestamoPorId: async (id) => {
    const response = await api.get(`/prestamos/${id}`);
    return response.data;
  },

  obtenerPrestamosDeCliente: async (clienteId) => {
    const response = await api.get(`/prestamos/cliente/${clienteId}`);
    return response.data;
  },

  crearPrestamo: async (prestamoData) => {
    // prestamoData debe contener: cliente_id, monto, tasa_interes (decimal), plazo_meses, fecha_inicio
    const response = await api.post('/prestamos', prestamoData);
    return response.data;
  },

  eliminarPrestamo: async (id) => {
    const response = await api.delete(`/prestamos/${id}`);
    return response.data;
  }
};
