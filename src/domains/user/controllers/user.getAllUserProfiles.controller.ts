/**
 * @description Get all users
 * @request GET
 * @route /api/v1/users
 * @access Public
 */

import type { Request, Response } from 'express';
import type { UserSpecs } from '../schema/user.schema.js';
import { getUsers } from '../lib/user.findAllUsers.service.js';
import { errorHandler__500, errorHandler__404 } from '../../../utils/errorHandlers/codedErrorHandlers.js';
import log from '../../../utils/logger.js';

type UserProfileResponse = Pick<UserSpecs, 'id' | 'name' | 'email' | 'isAdmin' | 'isActive' | 'createdAt' | 'updatedAt'>;

type ResponseSpecs = {
  error?: string;
  responseMessage: string;
  response?: {
    users: UserProfileResponse[];
    accessToken: string;
    refreshToken: string;
  };
  sessionStatus?: string;
};

export const getAllUsers = async (req: Request<{}, ResponseSpecs>, res: Response<ResponseSpecs>) => {
  try {
    const users = await getUsers();

    if (!users || users.length === 0) {
      errorHandler__404({ errorMessage: 'no users found or users do not exist' }, res);
      return;
    }

    const mappedUsers: UserProfileResponse[] = users.map((user) => ({
      id: user.id,
      name: user.name || '',
      email: user.email,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    if (req.userData?.newUserAccessToken && req.userData?.newUserRefreshToken) {
      log.info({ level: 'info', totalUsers: mappedUsers.length }, 'Users retrieved successfully');

      res.status(200).json({
        responseMessage: 'Users retrieved successfully',
        response: {
          users: mappedUsers,
          accessToken: req.userData.newUserAccessToken,
          refreshToken: req.userData.newUserRefreshToken
        }
      });
    }
  } catch (error) {
    errorHandler__500(error, res);
    return;
  }
};
