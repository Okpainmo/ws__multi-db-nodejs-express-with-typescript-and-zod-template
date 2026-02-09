import type { Request, Response, NextFunction } from 'express';
import { errorHandler__403 } from '../utils/errorHandlers/codedErrorHandlers.js';
import type { UserSpecs } from '../domains/user/schema/user.schema.js';
import log from '../utils/logger.js';

/**
 * Admin Route Protection Middleware
 *
 * This middleware restricts access to any route path that includes "/admin".
 * It assumes that user authentication has already been done upstream and
 * that `req.user` holds the decoded user data including their role/profileType.
 *
 * The middleware:
 * 1. Checks if the request path includes "/admin"
 * 2. Verifies the user has admin privileges
 * 3. Blocks unauthorized access with a 403 response
 * 4. Allows non-admin or non-protected routes to pass through
 */

type ResponseSpecs = {
  error?: string;
  responseMessage: string;
  response?: {
    user: UserSpecs;
    // token: string;
  };
};

export const adminRoutesProtector = (req: Request, res: Response<ResponseSpecs>, next: NextFunction) => {
  const path = req.originalUrl || req.path;

  // Only guard routes that include "/admin"
  if (path.includes('/admin/')) {
    // receive userData from previous middleware
    const user = req?.userData?.user;

    if (!user?.isAdmin || !user.isActive) {
      // extra activeness check in case of de-activated admins
      log.warn({ level: 'warn', method: req.method, path }, 'Unauthorized access attempt on admin route');

      errorHandler__403(
        {
          errorMessage: 'request rejected, admins only',
          context: { email: user?.email, userId: user?.id, isAdmin: user?.isAdmin, isActive: user?.isActive }
        },
        res
      );

      return;
    }

    log.info({ level: 'info', email: user.email || 'Unknown user', method: req.method, path }, 'Admin access granted');
  }

  next();
};
