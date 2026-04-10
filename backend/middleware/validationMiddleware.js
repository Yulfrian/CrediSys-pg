import { ZodError } from 'zod';

/**
 * Middleware factory that validates request body against a Zod schema.
 * Usage: router.post('/', validate(createSolicitudSchema), controllerFn);
 */
export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ mensaje: 'Datos inválidos', detalle: err.errors });
    }
    next(err);
  }
};
