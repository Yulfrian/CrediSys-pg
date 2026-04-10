import api from './api';

export const clienteService = {
  obtenerClientes: async () => {
    const response = await api.get('/clientes');
    return response.data;
  },
  
  obtenerClientePorId: async (id) => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
  },

  crearCliente: async (clienteData) => {
    const response = await api.post('/clientes', clienteData);
    return response.data;
  },

  actualizarCliente: async (id, clienteData) => {
    const response = await api.put(`/clientes/${id}`, clienteData);
    return response.data;
  },

  eliminarCliente: async (id) => {
    const response = await api.delete(`/clientes/${id}`);
    return response.data;
  }
};
