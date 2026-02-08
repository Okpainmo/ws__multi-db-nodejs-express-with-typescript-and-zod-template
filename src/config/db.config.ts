import validatedEnv from './base.js';

export const dbConfig = {
  type: validatedEnv.DATABASE_TYPE,
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
