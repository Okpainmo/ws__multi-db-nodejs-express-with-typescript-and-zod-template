import validatedEnv from './base.js';
export const serverConfig = {
    port: validatedEnv.PORT,
    env: validatedEnv.NODE_ENV
};
export default serverConfig;
