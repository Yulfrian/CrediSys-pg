import api from './api';

export const reportesService = {
  obtenerPrestamosActivos: async () => {
    const response = await api.get('/reportes/prestamos-activos');
    return response.data;
  },
  
  obtenerClientesMorosos: async () => {
    const response = await api.get('/reportes/clientes-morosos');
    return response.data;
  },

  obtenerGanancias: async () => {
    const response = await api.get('/reportes/ganancias');
    return response.data;
  },

  obtenerCapitalPrestado: async () => {
    const response = await api.get('/reportes/capital-prestado');
    return response.data;
  }
};
