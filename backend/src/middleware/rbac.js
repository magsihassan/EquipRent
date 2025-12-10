// Role-based access control middleware

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { message: 'Authentication required' }
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied. Insufficient permissions.' }
            });
        }

        next();
    };
};

// Check if user is verified
const requireVerified = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
    }

    if (!req.user.is_verified) {
        return res.status(403).json({
            success: false,
            error: { message: 'Account verification required' }
        });
    }

    next();
};

// Check if user owns the resource
const isOwner = (getResourceOwnerId) => {
    return async (req, res, next) => {
        try {
            const resourceOwnerId = await getResourceOwnerId(req);

            if (!resourceOwnerId) {
                return res.status(404).json({
                    success: false,
                    error: { message: 'Resource not found' }
                });
            }

            // Admin can access anything
            if (req.user.role === 'admin') {
                return next();
            }

            if (resourceOwnerId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: { message: 'Access denied. You do not own this resource.' }
                });
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = { authorize, requireVerified, isOwner };
