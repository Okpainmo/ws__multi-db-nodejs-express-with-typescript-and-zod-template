import { dbConfig } from '../../../config/index.js';
import { userModel } from '../models/user.model.js';
import { prisma } from '../../../lib/prisma.js';
import { customServiceErrorHandler } from '../../../utils/errorHandlers/customServiceErrorHandler.js';
import type { UserSpecs } from '../schema/user.schema.js';

/**
 * updateUser service: handles both MongoDB and PostgreSQL logic
 * based on the preferred database selection.
 */
export async function updateUser({ userId, email, requestBody }: { userId?: any; email?: string; requestBody: UserSpecs }) {
  try {
    const dbType = dbConfig.domains.user;
    let updatedUser: any = null;

    if (dbType === 'mongodb') {
      const query = email ? { email } : { _id: userId };
      const user = await userModel.findOneAndUpdate(query, { $set: requestBody }, { new: true, select: '-password' });

      if (user) {
        user.id = user._id; // ensure uniform use of 'id'
        updatedUser = user;
      }
    }

    if (dbType === 'postgresql') {
      const where = email ? { email } : { id: userId ? Number(userId) : undefined };
      if (!where.email && !where.id) return null;

      const user = await prisma.user.update({
        where: where as any,
        data: {
          name: requestBody.name || undefined,
          email: requestBody.email,
          password: requestBody.password,
          isAdmin: requestBody.isAdmin,
          isActive: requestBody.isActive,
          accessToken: requestBody.accessToken,
          refreshToken: requestBody.refreshToken
        },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          accessToken: true,
          refreshToken: true
        }
      });

      updatedUser = user;
    }

    return updatedUser;
  } catch (error) {
    customServiceErrorHandler(error);
    return;
  }
}
