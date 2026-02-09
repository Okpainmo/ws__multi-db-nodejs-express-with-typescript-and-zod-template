import { dbConfig } from '../../../config/index.js';
import { userModel } from '../../user/models/user.model.js';
import { prisma } from '../../../lib/prisma.js';
import { customServiceErrorHandler } from '../../../utils/errorHandlers/customServiceErrorHandler.js';
import type { UserSpecs } from '../../user/schema/user.schema.js';

/**
 * createUser service: handles both MongoDB and PostgreSQL logic
 * based on the preferred database selection.
 */
export async function createUser(data: { user: UserSpecs }) {
  try {
    const dbType = dbConfig.domains.auth;
    let createdUser: any = null;

    if (dbType === 'mongodb') {
      const { name, email, password } = data.user;
      const newUser: UserSpecs = await userModel.create({ name, email, password });

      createdUser = {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      };
    }

    if (dbType === 'postgresql') {
      const user = await prisma.user.create({
        data: {
          name: data.user.name as string,
          email: data.user.email as string,
          password: data.user.password as string
        },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      createdUser = user;
    }

    return createdUser;
  } catch (error) {
    customServiceErrorHandler(error);
    return;
  }
}
