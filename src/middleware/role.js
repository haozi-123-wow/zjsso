const roleHierarchy = {
  user: 1,
  developer: 2,
  admin: 3
};

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: '需要登录才能访问',
        statusCode: 401
      });
    }

    const userRole = req.user.role || 'user';

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = Math.max(
      ...allowedRoles.map(r => roleHierarchy[r] || 0)
    );

    if (userLevel >= requiredLevel) {
      return next();
    }

    return res.status(403).json({
      error: 'forbidden',
      message: '权限不足，需要 ' + allowedRoles.join(' / ') + ' 角色',
      current_role: userRole,
      statusCode: 403
    });
  };
}

function requireRoleExact(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: '需要登录才能访问',
        statusCode: 401
      });
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      error: 'forbidden',
      message: '权限不足，需要 ' + allowedRoles.join(' / ') + ' 角色',
      current_role: req.user.role,
      statusCode: 403
    });
  };
}

module.exports = { requireRole, requireRoleExact };