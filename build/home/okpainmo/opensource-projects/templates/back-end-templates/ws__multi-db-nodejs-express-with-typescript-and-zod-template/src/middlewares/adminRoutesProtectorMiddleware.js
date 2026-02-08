import log from '../utils/logger.js';
import { errorHandler__401 } from '../utils/errorHandlers/codedErrorHandlers.js';
export const adminRoutesProtector = (req, res, next) => {
    const path = req.originalUrl || req.path;
    // Only guard routes that include "/admin"
    if (path.includes('/admin/')) {
        // receive userData from previous middleware
        const user = req?.userData?.user;
        if (!user?.isAdmin || !user.isActive) {
            // extra activeness check in case of de-activated admins
            log.warn(`Unauthorized access attempt on admin route: ${req.method} ${path}`);
            errorHandler__401('request rejected, admins only', res);
            return;
        }
        log.info(`Admin access granted to: ${user.email || 'Unknown user'} -> ${req.method} ${path}`);
    }
    next();
};
