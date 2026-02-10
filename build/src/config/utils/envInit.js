import dotenv from 'dotenv';
import path from 'path';
/**
 * Initialize environment variables based on NODE_ENV.
 * This should be called before any other config is accessed.
 */
export const initEnv = () => {
    // Load primary .env file
    dotenv.config();
    const nodeEnv = process.env.NODE_ENV || 'development';
    // Map environment to specific .env files
    const envFiles = {
        development: '.env.development',
        staging: '.env.staging',
        production: '.env.production'
    };
    const envFile = envFiles[nodeEnv];
    if (envFile) {
        dotenv.config({ path: path.resolve(process.cwd(), envFile) });
    }
};
// Initialize environment variables immediately upon import
initEnv();
