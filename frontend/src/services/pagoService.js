import api from './api';

export const pagoService = {
  obtenerPagosDePrestamo: async (prestamoId) => {
    const response = await api.get(`/pagos/prestamo/${prestamoId}`);
    return response.data;
  },

  registrarPago: async (pagoData) => {
    // pagoData debe incluir: prestamo_id, cuota_id, monto_pagado
    const response = await api.post('/pagos', pagoData);
    return response.data;
  }
};
