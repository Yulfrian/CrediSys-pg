import api from './api';

export const solicitudService = {
  crearSolicitud: async (solicitudData) => {
    // solicitudData: { monto, plazo_meses, motivo }
    const response = await api.post('/solicitudes/mi-portal', solicitudData);
    return response.data;
  },

  obtenerMisSolicitudes: async () => {
    const response = await api.get('/solicitudes/mi-portal');
    return response.data;
  },

  obtenerTodasLasSolicitudes: async () => {
    const response = await api.get('/solicitudes');
    return response.data;
  },

  cambiarEstado: async (id, estado, tasa_interes = null, fecha_inicio = null) => {
    // estado: 'aprobada' o 'rechazada'
    const payload = { estado };
    if (estado === 'aprobada') {
       payload.tasa_interes = tasa_interes;
       payload.fecha_inicio = fecha_inicio;
    }
    const response = await api.put(`/solicitudes/${id}/estado`, payload);
    return response.data;
  }
};
