import validatedEnv from '../utils/base.js';

export const serverConfig = {
  port: validatedEnv.PORT,
  env: validatedEnv.NODE_ENV,
  serviceName: validatedEnv.SERVICE_NAME
};

export default serverConfig;
