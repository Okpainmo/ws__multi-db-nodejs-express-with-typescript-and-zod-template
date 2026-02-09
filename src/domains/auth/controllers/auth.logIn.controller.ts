/**
 * @description Log in a new user
 * @request POST
 * @route /api/v1/auth/log-in
 * @access Public
 */

import type { Request, Response } from 'express';
import type { UserSpecs } from '../../user/schema/user.schema.js';
import { findUser } from '../../user/lib/user.findUser.service.js';
import { updateUser } from '../../user/lib/user.updateUser.service.js';
import { errorHandler__403, errorHandler__404, errorHandler__500 } from '../../../utils/errorHandlers/codedErrorHandlers.js';
import { deployAuthCookie } from '../../../utils/cookieDeployHandlers.js';
import { generateTokens } from '../../../utils/generateTokens.js';
import { decryptHandler } from '../../../utils/decryptHandler.js';
import log from '../../../utils/logger.js';

type UserProfileResponse = Pick<
  UserSpecs,
  'id' | 'name' | 'email' | 'isAdmin' | 'isActive' | 'createdAt' | 'updatedAt' | 'accessToken' | 'refreshToken'
>;

type inSpecs = {
  email: string;
  password: string;
};

type ResponseSpecs = {
  error?: string;
  responseMessage: string;
  response?: {
    userProfile: UserProfileResponse;
    accessToken: string;
    refreshToken: string;
  };
};

type AuthTokenSpecs = {
  authCookie: string;
  accessToken: string;
  refreshToken: string;
};

export const LogIn = async (req: Request<{}, ResponseSpecs, inSpecs>, res: Response<ResponseSpecs>) => {
  try {
    const existingUser = await findUser({ email: req.body.email });

    if (!existingUser) {
      errorHandler__404({ errorMessage: 'user not found or does not exist', context: { email: req.body.email } }, res);

      return;
    }

    const hashedPassword = existingUser?.password as string;
    const comparePasswords = await decryptHandler({ stringToCompare: req.body?.password, hashedString: hashedPassword });

    if (!comparePasswords) {
      errorHandler__403({ errorMessage: 'incorrect password: login unsuccessful', context: { email: req.body.email, userId: existingUser.id } }, res);

      return;
    }

    if (existingUser && existingUser.email && existingUser.id) {
      // generate auth tokens
      const authTokens = await generateTokens({ tokenType: 'auth', user: { id: existingUser.id, email: existingUser.email } });

      // authTokenSpecs from global.d.ts
      const { accessToken, refreshToken, authCookie } = authTokens as AuthTokenSpecs;

      if (accessToken && refreshToken && authCookie) {
        await updateUser({
          email: existingUser.email,
          requestBody: {
            accessToken: accessToken,
            refreshToken: refreshToken
          }
        });

        deployAuthCookie({ authCookie }, res);

        log.info({ level: 'info', userId: existingUser.id, email: existingUser.email }, 'User logged in successfully');

        res.status(201).json({
          responseMessage: 'User logged in successfully',
          response: {
            userProfile: {
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
              isAdmin: existingUser.isAdmin,
              isActive: existingUser.isActive,
              createdAt: existingUser.createdAt,
              updatedAt: existingUser.updatedAt
            },
            accessToken: accessToken,
            refreshToken: refreshToken
          }
        });
      }
    }
  } catch (error) {
    errorHandler__500(error, res);

    return;
  }
};
