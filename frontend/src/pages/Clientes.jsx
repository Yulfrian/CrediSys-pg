import React, { useState, useEffect } from 'react';
import { clienteService } from '../services/clienteService';
import './Clientes.css';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para el Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCliente, setCurrentCliente] = useState({
    nombre: '', apellido: '', dni: '', telefono: '', email: '', direccion: ''
  });

  // Cargar clientes al montar el componente
  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const data = await clienteService.obtenerClientes();
      setClientes(data.clientes || []);
      setError(null);
    } catch (err) {
      console.error("Error cargando clientes:", err);
      setError("No se pudieron cargar los clientes. Por favor intente más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cliente = null) => {
    if (cliente) {
      setIsEditing(true);
      setCurrentCliente(cliente);
    } else {
      setIsEditing(false);
      setCurrentCliente({ nombre: '', apellido: '', dni: '', telefono: '', email: '', direccion: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCliente({ ...currentCliente, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await clienteService.actualizarCliente(currentCliente.id, currentCliente);
      } else {
        await clienteService.crearCliente(currentCliente);
      }
      fetchClientes(); // Recargar lista
      handleCloseModal();
    } catch (err) {
      console.error("Error guardando cliente:", err);
      alert(err.response?.data?.mensaje || "Error al guardar el cliente");
    }
  };

  const handleDeleteCliente = async (cliente) => {
    const confirmar = window.confirm(`🛑 ADVERTENCIA DE ELIMINACIÓN:\n\n¿Estás absolutamente seguro de que deseas eliminar permanentemente a ${cliente.nombre} ${cliente.apellido}?\n\nEsta acción borrará al instante TODO su historial: Préstamos, Cuotas, Recibos de Pago y Documentos asociados. No se puede deshacer.`);
    if (!confirmar) return;

    try {
      setLoading(true);
      await clienteService.eliminarCliente(cliente.id);
      fetchClientes(); 
    } catch (err) {
      console.error("Error eliminando cliente:", err);
      alert(err.response?.data?.mensaje || "No tienes permisos para eliminar clientes o ocurrió un error.");
      setLoading(false);
    }
  };

  const user = JSON.parse(localStorage.getItem('credisys_user')) || {};
  const isAdmin = user.rol === 'administrador';

  return (
    <div className="clientes-container">
      <div className="clientes-header">
        <div>
          <h1 className="dashboard-title">Gestión de Clientes</h1>
          <p className="dashboard-subtitle">Administra tu cartera de clientes y registra nuevos prestatarios.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + Nuevo Cliente
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando clientes...</div>
        ) : (
          <table className="clientes-table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>DNI / Cédula</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length > 0 ? (
                clientes.map(cliente => (
                  <tr key={cliente.id}>
                    <td>{cliente.nombre} {cliente.apellido}</td>
                    <td>{cliente.dni}</td>
                    <td>{cliente.telefono}</td>
                    <td>{cliente.email}</td>
                    <td className="actions-cell">
                      <button className="btn-secondary" onClick={() => handleOpenModal(cliente)}>Editar</button>
                      {isAdmin && (
                        <button className="btn-secondary" onClick={() => handleDeleteCliente(cliente)} style={{ color: 'red', borderColor: 'red' }}>
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>No se encontraron clientes.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Formulario */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="cliente-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Nombre *</label>
                  <input type="text" name="nombre" value={currentCliente.nombre} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Apellido *</label>
                  <input type="text" name="apellido" value={currentCliente.apellido} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="form-group">
                <label>DNI / Cédula *</label>
                <input type="text" name="dni" value={currentCliente.dni} onChange={handleInputChange} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="text" name="telefono" value={currentCliente.telefono} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value={currentCliente.email} onChange={handleInputChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <textarea name="direccion" value={currentCliente.direccion} onChange={handleInputChange} rows="3"></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;
