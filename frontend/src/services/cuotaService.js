import api from './api';

export const cuotaService = {
  obtenerCuotasDePrestamo: async (prestamoId) => {
    const response = await api.get(`/cuotas/prestamo/${prestamoId}`);
    return response.data;
  }
};
