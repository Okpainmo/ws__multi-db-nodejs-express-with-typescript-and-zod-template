import { prisma } from '../lib/prisma.js';

const connectPostgres = async () => {
  if (prisma) {
    await prisma.$connect();
  }
};

export default connectPostgres;
