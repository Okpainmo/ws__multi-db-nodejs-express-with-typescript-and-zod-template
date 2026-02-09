import './envInit.js';
import { envSchema } from '../schema/schema.js';
import log from '../../utils/logger.js';
/**
 * Validate and parse environment variables
 */
const _env = envSchema.safeParse(process.env);
if (!_env.success) {
    log.error('❌ Invalid environment variables:');
    console.error(_env.error.flatten().fieldErrors);
    process.exit(1);
}
export const validatedEnv = _env.data;
export default validatedEnv;
