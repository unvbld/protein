export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Access forbidden',
                message: `This resource requires one of the following roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

export const requireAdmin = requireRole('admin');
