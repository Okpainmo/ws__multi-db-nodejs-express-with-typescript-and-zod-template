import { dbConfig } from '../../../config/index.js';
import { userModel } from '../models/user.model.js';
import { prisma } from '../../../lib/prisma.js';
import { customServiceErrorHandler } from '../../../utils/errorHandlers/customServiceErrorHandler.js';

/**
 * Retrieves a list of users.
 * Supports MongoDB and PostgreSQL based on domain configuration.
 */
export async function getUsers(params?: { email?: string; limit?: number; offset?: number }): Promise<any[]> {
  try {
    const { email, limit = 50, offset = 0 } = params ?? {};
    const dbType = dbConfig.domains.user;

    switch (dbType) {
      case 'mongodb': {
        const query = email ? { email } : {};

        const users = await userModel.find(query).skip(offset).limit(limit).lean();

        return users.map((user) => ({
          ...user,
          id: user._id.toString()
        }));
      }

      case 'postgresql': {
        return await prisma.user.findMany({
          where: email ? { email } : undefined,
          skip: offset,
          take: limit
        });
      }

      default:
        return [];
    }
  } catch (error) {
    customServiceErrorHandler(error);
    return [];
  }
}
