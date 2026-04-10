import { supabase } from '../config/supabaseClient.js';

// Subir documento (Manejo de registros)
// Usualmente aquí usarías 'multer' y subirías al bucket Storage de Supabase, 
// Pero como estamos trabajando los endpoints estructurados, registraremos en tabla.
export const registrarDocumento = async (req, res) => {
  try {
    const { cliente_id, nombre_archivo, url_archivo, tipo_documento } = req.body;

    if (!cliente_id || !nombre_archivo || !url_archivo) {
      return res.status(400).json({ mensaje: 'Faltan datos obligatorios del documento' });
    }

    const { data, error } = await supabase
      .from('documentos')
      .insert([{ cliente_id, nombre_archivo, url_archivo, tipo_documento }])
      .select()
      .single();

    if (error) return res.status(500).json({ mensaje: 'Error al registrar documento', detalle: error.message });

    return res.status(201).json({ mensaje: 'Documento registrado exitosamente', documento: data });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error interno', detalle: err.message });
  }
};

// Ver documentos de un cliente: GET /documentos/cliente/:cliente_id
export const obtenerDocumentosCliente = async (req, res) => {
    try {
        const { cliente_id } = req.params;

        const { data, error } = await supabase
            .from('documentos')
            .select('*')
            .eq('cliente_id', cliente_id)
            .order('fecha_subida', { ascending: false });

        if (error) return res.status(500).json({ mensaje: 'Error al consultar documentos', detalle: error.message });

        return res.status(200).json({ documentos: data });
    } catch (err) {
        return res.status(500).json({ mensaje: 'Error interno', detalle: err.message });
    }
};

// Eliminar documento (DELETE /documentos/:id)
export const eliminarDocumento = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('documentos').delete().eq('id', id);
        
        if (error) return res.status(500).json({ mensaje: 'Error al eliminar documento', detalle: error.message });
        
        return res.status(200).json({ mensaje: 'Documento eliminado del expediente' });
    } catch (err) {
        return res.status(500).json({ mensaje: 'Error interno', detalle: err.message });
    }
};
