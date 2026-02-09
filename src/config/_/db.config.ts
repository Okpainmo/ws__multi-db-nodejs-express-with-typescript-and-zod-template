import validatedEnv from '../utils/base.js';

export const dbConfig = {
  type: validatedEnv.DATABASE_TYPE,
  domains: {
    admin: validatedEnv.DATABASE_TYPE_ADMIN,
    auth: validatedEnv.DATABASE_TYPE_AUTH,
    user: validatedEnv.DATABASE_TYPE_USER,
    logs: validatedEnv.DATABASE_TYPE_LOGS
  },

  get requiredTypes() {
    return Array.from(new Set(Object.values(this.domains)));
  },

  mongodb: {
    uri: validatedEnv.MONGO_DB_URI,
    name: validatedEnv.MONGO_DATABASE_NAME
  },

  postgresql: {
    url: validatedEnv.POSTGRES_DATABASE_URL,
    user: validatedEnv.POSTGRES_USER,
    dbName: validatedEnv.POSTGRES_DATABASE_NAME
  }
};

export default dbConfig;
