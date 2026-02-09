import validatedEnv from '../utils/base.js';

export const wsConfig = {
  path: validatedEnv.WS_PATH,
  heartbeatInterval: validatedEnv.WS_HEARTBEAT_INTERVAL,
  shutdownTimeout: validatedEnv.WS_SHUTDOWN_TIMEOUT
};

export default wsConfig;
