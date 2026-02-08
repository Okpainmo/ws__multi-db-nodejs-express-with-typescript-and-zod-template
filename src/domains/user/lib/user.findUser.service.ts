import { dbConfig } from '../../../config/index.js';
import { userModel } from '../models/user.model.js';
import { prisma } from '../../../lib/prisma.js';
import { customServiceErrorHandler } from '../../../utils/errorHandlers/customServiceErrorHandler.js';

/**
 * findUser service: handles both MongoDB and PostgreSQL logic
 * based on the preferred database selection.
 */
export async function findUser({ userId, email }: { userId?: any; email?: string }) {
  try {
    if (dbConfig.type === 'mongodb') {
      const query = email ? { email } : { _id: userId };
      const user = await userModel.findOne(query);

      if (user) {
        user.id = user._id; // ensure uniform use of 'id'

        return user;
      }
      return;
    }

    if (dbConfig.type === 'postgresql') {
      const where = email ? { email } : { id: userId ? Number(userId) : undefined };
      if (!where.email && !where.id) return null;

      const user = await prisma.user.findUnique({ where: where as any });
      return user;
    }

    return null;
  } catch (error) {
    customServiceErrorHandler(error);
    return;
  }
}
