import { z } from 'zod';

// Solicitud de préstamo (cliente)
export const crearSolicitudSchema = z.object({
  monto: z.number().positive(),
  plazo_meses: z.number().int().positive(),
  motivo: z.string().min(5),
});

// Cambio de estado de solicitud (admin)
export const cambiarEstadoSchema = z.object({
  estado: z.enum(['aprobada', 'rechazada']),
  // tasa_interes required only when approved
  tasa_interes: z.number().optional(),
  fecha_inicio: z.string().optional(),
}).refine((data) => {
  if (data.estado === 'aprobada') {
    return data.tasa_interes !== undefined && data.fecha_inicio !== undefined;
  }
  return true;
}, {
  message: 'tasa_interes y fecha_inicio son obligatorios cuando el estado es aprobada',
  path: ['tasa_interes', 'fecha_inicio'],
});
