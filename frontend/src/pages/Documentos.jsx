import React, { useState, useEffect } from 'react';
import { clienteService } from '../services/clienteService';
import { documentoService } from '../services/documentoService';
import { Search, FileText, Image as ImageIcon, UploadCloud, File, Eye, CheckCircle } from 'lucide-react';
import './Documentos.css';

const Documentos = () => {
  const [clientes, setClientes] = useState([]);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [tipoDoc, setTipoDoc] = useState('Cédula');
  const [archivoBase64, setArchivoBase64] = useState('');
  const [nombreArchivo, setNombreArchivo] = useState('');

  // Initial load
  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const data = await clienteService.obtenerClientes();
      setClientes(data.clientes || []);
      setClientesFiltrados(data.clientes || []);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setBusqueda(term);
    setClientesFiltrados(
      clientes.filter(c => 
        c.nombre.toLowerCase().includes(term) || 
        c.apellido.toLowerCase().includes(term) ||
        c.dni.includes(term)
      )
    );
  };

  const seleccionarCliente = async (cliente) => {
    setClienteSeleccionado(cliente);
    try {
      setLoading(true);
      const res = await documentoService.obtenerDocumentosCliente(cliente.id);
      setDocumentos(res.documentos || []);
    } catch (error) {
      console.error('Error cargando documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo (Restricción del usuario)
    const tiposPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!tiposPermitidos.includes(file.type)) {
      alert('Formato no permitido. Solo se aceptan imágenes (PNG/JPG) o documentos PDF.');
      e.target.value = null; // Limpiar
      return;
    }

    setNombreArchivo(file.name);

    // Leer archivo usando FileReader para simular guardado físico / Base64 UI Test
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setArchivoBase64(reader.result);
    };
    reader.onerror = (error) => {
      console.error('Error convirtiendo archivo', error);
      alert('Hubo un error leyendo el archivo.');
    };
  };

  const subirDocumento = async (e) => {
    e.preventDefault();
    if (!archivoBase64 || !nombreArchivo) {
      alert('Por favor selecciona un archivo válido.');
      return;
    }

    try {
      const reqData = {
        cliente_id: clienteSeleccionado.id,
        nombre_archivo: nombreArchivo,
        url_archivo: archivoBase64, // Simulando URL física
        tipo_documento: tipoDoc
      };

      await documentoService.registrarDocumento(reqData);
      
      // Limpiar y refrescar
      setArchivoBase64('');
      setNombreArchivo('');
      setTipoDoc('Cédula');
      setShowModal(false);
      
      seleccionarCliente(clienteSeleccionado);
    } catch (err) {
      console.error('Error subiendo:', err);
      alert('Hubo un problema registrando el documento.');
    }
  };

  const handleDeleteDocumento = async (doc) => {
    const confirmar = window.confirm(`🛑 ADVERTENCIA:\n\n¿Estás seguro de que deseas borrar permanentemente el archivo "${doc.nombre_archivo}" del expediente?\n\nEsta acción NO se puede deshacer.`);
    if (!confirmar) return;

    try {
      setLoading(true);
      await documentoService.eliminarDocumento(doc.id);
      seleccionarCliente(clienteSeleccionado); // Refrescar lista del cliente actual
    } catch (err) {
      console.error("Error eliminando documento:", err);
      alert(err.response?.data?.mensaje || "No tienes permisos para eliminar este documento o ocurrió un error.");
      setLoading(false);
    }
  };

  const user = JSON.parse(localStorage.getItem('credisys_user')) || {};
  const isAdmin = user.rol === 'administrador';

  const abrirVisor = (url) => {
    // Si la URL es una imagen base64 o PDF base64 el navegador lo puede abrir
    if (url && url !== '#') {
      const nuevaVentana = window.open();
      if (nuevaVentana) {
          nuevaVentana.document.write(`<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      }
    } else {
      alert('Este archivo no tiene una vista previa válida asginada (Mock vacío).');
    }
  };

  // UI Helpers
  const renderIcon = (nombre) => {
    const ext = nombre.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FileText size={32} className="doc-icon pdf-color" />;
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return <ImageIcon size={32} className="doc-icon img-color" />;
    return <File size={32} className="doc-icon" />;
  };

  return (
    <div className="documentos-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Expedientes Digitales</h1>
          <p className="dashboard-subtitle">Gestiona la documentación vital (ID, Pagarés, Contratos) de tus clientes.</p>
        </div>
      </div>

      <div className="layout-grid-docs">
        {/* Panel Izquierdo: Directorio de Clientes */}
        <div className="panel izquierdo">
          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar cliente por cédula o nombre..." 
              value={busqueda}
              onChange={handleSearch}
            />
          </div>

          <div className="lista-clientes-docs">
            {loading && !clienteSeleccionado && <div className="loading">Cargando directorio...</div>}
            {!loading && clientesFiltrados.length === 0 && <div className="empty">No se encontraron clientes.</div>}

            {clientesFiltrados.map(c => (
              <div 
                key={c.id} 
                className={`cliente-card-doc ${clienteSeleccionado?.id === c.id ? 'active' : ''}`}
                onClick={() => seleccionarCliente(c)}
              >
                <div className="avatar-placeholder">
                  {c.nombre.charAt(0)}{c.apellido.charAt(0)}
                </div>
                <div className="cliente-info-mini">
                  <strong>{c.nombre} {c.apellido}</strong>
                  <span>{c.dni}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel Derecho: Visor de Archivos */}
        <div className="panel derecho flex-column">
          {clienteSeleccionado ? (
            <div className="expediente-wrapper">
              <div className="expediente-header">
                <div className="exp-titles">
                  <h2>Expediente de {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</h2>
                  <p>Archivos y contratos registrados en la plataforma.</p>
                </div>
                <button className="btn-primary flex-center" onClick={() => setShowModal(true)}>
                  <UploadCloud size={18} style={{marginRight: '0.5rem'}} />
                  Añadir Documento
                </button>
              </div>

              <div className="documentos-grid fade-in">
                {documentos.length > 0 ? (
                  documentos.map(doc => (
                    <div key={doc.id} className="doc-card">
                      <div className="doc-preview-icon">
                        {renderIcon(doc.nombre_archivo)}
                      </div>
                      <div className="doc-details">
                        <span className="doc-badge">{doc.tipo_documento}</span>
                        <h4 className="truncate" title={doc.nombre_archivo}>{doc.nombre_archivo}</h4>
                        <small>{new Date(doc.fecha_subida).toLocaleDateString()}</small>
                      </div>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <button className="btn-icon view-btn" onClick={() => abrirVisor(doc.url_archivo)} title="Ver Documento">
                          <Eye size={18} />
                        </button>
                        {isAdmin && (
                          <button 
                            className="btn-icon" 
                            onClick={() => handleDeleteDocumento(doc)} 
                            title="Eliminar Documento" 
                            style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer' }}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-large col-span-full">
                    <FileText size={48} className="empty-icon" />
                    <h3>Expediente Vacío</h3>
                    <p>Este cliente aún no tiene documentos digitalizados.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state-large">
              <Search size={48} className="empty-icon" />
              <h3>Selecciona un cliente</h3>
              <p>Busca en el directorio izquierdo para explorar el expediente documental.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Subida */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-upload" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Nuevo Documento</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={subirDocumento} className="upload-form">
              <div className="form-group">
                <label>Tipo de Documento *</label>
                <select value={tipoDoc} onChange={e => setTipoDoc(e.target.value)} required>
                  <option value="Cédula">Cédula de Identidad (ID)</option>
                  <option value="Contrato">Contrato de Préstamo</option>
                  <option value="Pagaré">Pagaré Notarial</option>
                  <option value="Factura">Garantía / Factura</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="form-group dropzone-wrapper">
                <label>Archivo (PNG, JPG o PDF) *</label>
                <div className="dropzone-box">
                  <UploadCloud size={40} className="drop-icon" />
                  <p>Presiona para elegir el archivo de tu computadora</p>
                  <small>Solo archivos .png, .jpg y .pdf</small>
                  
                  {/* Este input se encarga del filtro restrictivo a nivel de sistema antes del clic */}
                  <input 
                    type="file" 
                    className="file-input-hidden" 
                    onChange={handleFileChange} 
                    accept="image/png, image/jpeg, image/jpg, application/pdf"
                    required 
                  />
                </div>
                {nombreArchivo && (
                  <div className="file-selected-badge">
                    <CheckCircle size={16} className="icon-success" />
                    <span>{nombreArchivo}</span> cargado exitosamente en sistema.
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar en Expediente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documentos;
