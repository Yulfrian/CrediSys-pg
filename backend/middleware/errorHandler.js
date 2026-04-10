export const errorHandler = (err, req, res, next) => {
  console.error('ErrorHandler:', err);
  const status = err.status || 500;
  const message = err.message || 'Ocurrió un error inesperado en el servidor.';
  res.status(status).json({ mensaje: message, detalle: err.stack });
};
