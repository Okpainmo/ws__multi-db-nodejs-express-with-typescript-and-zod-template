import { errorHandler__403 } from '../utils/errorHandlers/codedErrorHandlers.js';
import log from '../utils/logger.js';
export const adminRoutesProtector = (req, res, next) => {
    const path = req.originalUrl || req.path;
    // Only guard routes that include "/admin"
    if (path.includes('/admin/')) {
        // receive userData from previous middleware
        const user = req?.userData?.user;
        if (!user?.isAdmin || !user.isActive) {
            // extra activeness check in case of de-activated admins
            log.warn({ level: 'warn', method: req.method, path }, 'Unauthorized access attempt on admin route');
            errorHandler__403({
                errorMessage: 'request rejected, admins only',
                context: { email: user?.email, userId: user?.id, isAdmin: user?.isAdmin, isActive: user?.isActive }
            }, res);
            return;
        }
        log.info({ level: 'info', email: user.email || 'Unknown user', method: req.method, path }, 'Admin access granted');
    }
    next();
};
