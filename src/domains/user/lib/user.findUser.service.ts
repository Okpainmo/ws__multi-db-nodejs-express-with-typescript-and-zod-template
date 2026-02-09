import { dbConfig } from '../../../config/index.js';
import { userModel } from '../models/user.model.js';
import { prisma } from '../../../lib/prisma.js';
import { customServiceErrorHandler } from '../../../utils/errorHandlers/customServiceErrorHandler.js';

/**
 * Finds a user by ID or email.
 * Supports MongoDB and PostgreSQL based on domain configuration.
 */
export async function findUser(params: { userId?: string | number; email?: string }): Promise<any | null> {
  try {
    const { userId, email } = params;
    const dbType = dbConfig.domains.user;

    if (!userId && !email) {
      return null;
    }

    switch (dbType) {
      case 'mongodb': {
        const query = email ? { email } : { _id: userId };
        const user = await userModel.findOne(query).lean();

        if (!user) return null;

        return {
          ...user,
          id: user._id.toString()
        };
      }

      case 'postgresql': {
        const where = email ? { email } : typeof userId !== 'undefined' ? { id: Number(userId) } : null;

        if (!where) return null;

        return await prisma.user.findUnique({ where });
      }

      default:
        return null;
    }
  } catch (error) {
    customServiceErrorHandler(error);
    return null;
  }
}
