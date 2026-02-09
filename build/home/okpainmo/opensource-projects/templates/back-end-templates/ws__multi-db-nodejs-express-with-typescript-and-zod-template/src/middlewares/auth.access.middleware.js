import jwt from 'jsonwebtoken';
import {} from 'express';
import { generateTokens } from '../utils/generateTokens.js';
import { errorHandler__401, errorHandler__403, errorHandler__404, errorHandler__500 } from '../utils/errorHandlers/codedErrorHandlers.js';
import { updateUser } from '../domains/user/lib/user.updateUser.service.js';
import { deployAuthCookie } from '../utils/cookieDeployHandlers.js';
/*
  SPLITTING THE ACCESS AND SESSIONS FROM EACH OTHER HELPS US FOCUS MORE ON THEIR SPECIAL USE-CASES,
  AND GIVES US EXTRA ROOM TO TRACK VALUABLE INFORMATION E.G. USER SUB-SESSION ACTIVITIES.
*/
const accessMiddleware = async (req, res, next) => {
    const requestHeaders = req.headers;
    // receive userData from previous middleware
    const user = req?.userData?.user;
    const { authorization } = requestHeaders;
    const jwtSecret = process.env.JWT_SECRET;
    // checking for the cookie again - just to be extra-secure
    if (!req.headers.cookie || !req.headers.cookie.includes('MultiDB_NodeExpressTypescript_Template')) {
        errorHandler__401({ errorMessage: 'request rejected, please re-authenticate', context: { reason: 'No valid auth cookie found' } }, res);
        return;
    }
    if (!user) {
        errorHandler__404({ errorMessage: 'user not received from sessions middleware', context: {} }, res);
        return;
    }
    if (!authorization || !authorization.startsWith('Bearer ')) {
        errorHandler__403({ errorMessage: 'authorization string does not match expected(Bearer Token) result', context: { userId: user.id } }, res);
        return;
    }
    const returnedAccessToken = authorization.split(' ')[1];
    if (returnedAccessToken && user && user.email && user.id) {
        // verify access-token, and proceed to renew(session, access, and cookie) since the session/refresh middleware was passed successfully
        try {
            const decodedAccessJWT = jwt.decode(returnedAccessToken, { complete: true });
            if (!decodedAccessJWT || decodedAccessJWT.payload.userEmail !== user?.email) {
                errorHandler__401({ errorMessage: 'user credentials do not match', context: { email: user.email, userId: user.id } }, res);
                return;
            }
            jwt.verify(returnedAccessToken, jwtSecret);
            // proceed to renew session since session middleware passed successfully
            const authTokens = await generateTokens({ tokenType: 'auth', user: { id: user.id, email: user.email } });
            // authTokenSpecs - from global.d.ts
            const { accessToken, refreshToken, authCookie } = authTokens;
            if (accessToken && refreshToken && authCookie) {
                await updateUser({
                    email: user.email,
                    requestBody: {
                        accessToken: accessToken,
                        refreshToken: refreshToken
                    }
                });
                deployAuthCookie({ authCookie: authCookie }, res);
                const sessionStatus = `ACTIVE ACCESS WITH ACTIVE SESSION: access and session renewed for '${user.email}'`;
                // log.info(sessionStatus);
                req.userData = {
                    user: user,
                    newUserAccessToken: accessToken,
                    newUserRefreshToken: refreshToken,
                    sessionStatus
                };
            }
            next();
        }
        catch (error) {
            if (error instanceof Error && error.name === 'TokenExpiredError') {
                // if (error instanceof Error && error.message === 'jwt expired') {
                // proceed to renew session since session middleware passed successfully
                const authTokens = await generateTokens({ tokenType: 'auth', user: { id: user.id, email: user.email } });
                // authTokenSpecs from global.d.ts
                const { accessToken, refreshToken, authCookie } = authTokens;
                if (accessToken && refreshToken && authCookie) {
                    await updateUser({
                        email: user.email,
                        requestBody: {
                            accessToken: accessToken,
                            refreshToken: refreshToken
                        }
                    });
                    deployAuthCookie({ authCookie: authCookie }, res);
                    const sessionStatus = `EXPIRED ACCESS WITH ACTIVE SESSION: access and session renewed for '${user.email}'`;
                    // log.info(sessionStatus);
                    req.userData = {
                        user: user,
                        newUserAccessToken: accessToken,
                        newUserRefreshToken: refreshToken,
                        sessionStatus
                    };
                }
                next();
            }
            else {
                errorHandler__500(error, res);
                return;
            }
        }
    }
};
export default accessMiddleware;
