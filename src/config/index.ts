import validatedEnv from './base.js';

export * from './server.config.js';
export * from './db.config.js';
export * from './jwt.config.js';
export * from './ws.config.js';

export const config = validatedEnv;
export default validatedEnv;
