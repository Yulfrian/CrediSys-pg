// Middleware Factory que genera middlewares de rol
export const autorizarRol = (rolesPermitidos) => {
    return (req, res, next) => {
      // req.user viene del authMiddleware
      if (!req.user || !req.user.rol) {
        return res.status(403).json({ mensaje: 'Acceso denegado: Usuario sin rol asignado.' });
      }
  
      if (!rolesPermitidos.includes(req.user.rol)) {
        return res.status(403).json({ 
            mensaje: 'Acceso denegado: No tienes permisos para realizar esta acción.',
            rolActual: req.user.rol
        });
      }
  
      next();
    };
  };
