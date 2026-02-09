import validatedEnv from './utils/base.js';

export * from './_/server.config.js';
export * from './_/db.config.js';
export * from './_/jwt.config.js';
export * from './_/ws.config.js';

export const config = validatedEnv;
export default validatedEnv;
