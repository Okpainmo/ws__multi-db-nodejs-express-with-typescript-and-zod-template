/**
 * @description Register a new user
 * @request POST
 * @route /api/v1/auth/register
 * @access Public
 */
import { createUser } from '../lib/auth.createUser.service.js';
import { findUser } from '../../user/lib/user.findUser.service.js';
import { updateUser } from '../../user/lib/user.updateUser.service.js';
import { errorHandler__400, errorHandler__500 } from '../../../utils/errorHandlers/codedErrorHandlers.js';
import { hashingHandler } from '../../../utils/hashingHandler.js';
import { deployAuthCookie } from '../../../utils/cookieDeployHandlers.js';
import { generateTokens } from '../../../utils/generateTokens.js';
import log from '../../../utils/logger.js';
export const registerUser = async (req, res) => {
    try {
        log.info(req.body);
        const existingUser = await findUser({ email: req.body.email });
        const hashedPassword = await hashingHandler({ stringToHash: req.body.password });
        if (existingUser) {
            errorHandler__400({ errorMessage: 'user already exists', context: { email: req.body.email, userId: existingUser.id } }, res);
            return;
        }
        req.body.password = hashedPassword;
        /*
        Always set the admin as below, to ensure that no user tricks the system and set a false admin.
        You'll then need to create an end-point for setting admins.
        */
        const registeredUser = await createUser({ user: { ...req.body, isAdmin: false } });
        if (registeredUser && registeredUser.email && registeredUser.id) {
            const authTokens = await generateTokens({ tokenType: 'auth', user: { id: registeredUser.id, email: registeredUser.email } });
            // authTokenSpecs from global.d.ts
            const { accessToken, refreshToken, authCookie } = authTokens;
            if (accessToken && refreshToken && authCookie) {
                await updateUser({
                    email: registeredUser.email,
                    requestBody: {
                        accessToken: accessToken,
                        refreshToken: refreshToken
                    }
                });
                deployAuthCookie({ authCookie: authCookie }, res);
                log.info({ level: 'info', userId: registeredUser.id, email: registeredUser.email }, 'User registered successfully');
                res.status(201).json({
                    responseMessage: 'User registered successfully',
                    response: {
                        userProfile: {
                            id: registeredUser.id,
                            name: registeredUser.name,
                            email: registeredUser.email,
                            isAdmin: registeredUser.isAdmin,
                            isActive: registeredUser.isActive,
                            createdAt: registeredUser.createdAt,
                            updatedAt: registeredUser.updatedAt
                        },
                        accessToken: accessToken,
                        refreshToken: refreshToken
                    }
                });
            }
        }
    }
    catch (error) {
        errorHandler__500(error, res);
        return;
    }
};
