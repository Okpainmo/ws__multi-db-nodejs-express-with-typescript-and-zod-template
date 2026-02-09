import type { Request, Response, NextFunction } from 'express';
import log from '../utils/logger.js';
import { randomUUID } from 'crypto';
import { serverConfig } from '../config/index.js';

/**
 * HTTP Request Logging Middleware
 *
 * This middleware provides structured request-level logging and basic
 * request lifecycle observability.
 *
 * Responsibilities:
 * 1. Ensures every incoming request has a unique `requestId`
 *    (reuses `x-request-id` if provided, otherwise generates one)
 * 2. Tracks request execution duration
 * 3. Logs request start and completion events
 * 4. Emits structured logs on completion for production-grade analysis
 *
 * This middleware is intentionally lightweight and framework-agnostic,
 * serving as a foundation for request correlation, performance monitoring,
 * and future trace integration.
 */

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Ensure a request-scoped correlation ID
  const requestId = req.headers['x-request-id'] ?? randomUUID();
  req.requestId = requestId as string;

  // Capture request metadata and start time
  const startTime = Date.now();
  const path = req.path;
  const method = req.method;

  // Log request boundary (human-readable)
  log.info(`...................................`);
  log.info(`Request started: ${method} ${path}`);

  // Log request completion once the response is fully sent
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    log.info(
      {
        requestId: req.requestId,
        method: req.method,
        path: path,
        status: res.statusCode,
        duration: `${duration}ms`,
        service: serverConfig.serviceName,
        env: serverConfig.env
      },
      `Request finished: ${method} ${path}`
    );

    // Closing request boundary
    log.info(`...................................`);
  });

  next();
};
