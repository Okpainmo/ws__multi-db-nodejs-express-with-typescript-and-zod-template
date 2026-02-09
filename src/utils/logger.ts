import pino from 'pino';
import dayjs from 'dayjs';
// import { serverConfig } from '../config/index.js';

const transport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: false,
    // forceColor: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname'
  }
});

const log = pino(
  {
    // level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),

    // Adding base("env" and "service") will be handled inside the request logger middleware
    // base: {
    //   service: serverConfig.serviceName ?? 'ws_server',
    //   env: serverConfig.env
    // },

    timestamp: () => `,"time":"${dayjs().toISOString()}"`,

    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token', '*.secret'],
      remove: true
    }
  },
  transport
);

export default log;
