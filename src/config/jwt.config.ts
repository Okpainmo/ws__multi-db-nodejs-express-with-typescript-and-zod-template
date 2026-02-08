import validatedEnv from './base.js';

export const jwtConfig = {
  secret: validatedEnv.JWT_SECRET,
  accessExpiration: validatedEnv.JWT_ACCESS_EXPIRATION_TIME,
  sessionExpiration: validatedEnv.JWT_SESSION_EXPIRATION_TIME,
  otpLifetime: validatedEnv.JWT_ONE_TIME_PASSWORD_LIFETIME
};

export default jwtConfig;
