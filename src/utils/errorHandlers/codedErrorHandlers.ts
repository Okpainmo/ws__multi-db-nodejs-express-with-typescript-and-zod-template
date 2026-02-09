import log from '../logger.js';
import type { Response } from 'express';

/**
 * Shared error payload shape for client responses
 */
interface ErrorResponsePayload {
  responseMessage: string;
  error: string;
}

/**
 * Optional contextual metadata for logging
 */
interface ErrorContext {
  [key: string]: unknown;
}

/**
 * 500 – Internal Server Error
 * Unexpected, server-side failures
 */
export const errorHandler__500 = (error: unknown, res: Response): void => {
  if (error instanceof Error) {
    log.error(
      {
        level: 'error',
        err: error
      },
      'Internal Server Error'
    );

    res.status(500).json({
      responseMessage: 'Request was unsuccessful: internal server error',
      error: error.message
    } satisfies ErrorResponsePayload);
    return;
  }

  log.error(
    {
      level: 'error',
      error
    },
    'Internal Server Error (non-Error thrown)'
  );

  res.status(500).json({
    responseMessage: 'Request was unsuccessful: internal server error',
    error: 'UNKNOWN_ERROR'
  } satisfies ErrorResponsePayload);
};

/**
 * 403 – Forbidden
 * Authenticated but not allowed
 */
export const errorHandler__403 = (data: { errorMessage: string; context?: ErrorContext }, res: Response): void => {
  log.warn(
    {
      level: 'warn',
      context: data.context,
      errorMessage: data.errorMessage
    },
    'Forbidden'
  );

  res.status(403).json({
    responseMessage: data.errorMessage,
    error: 'FORBIDDEN'
  } satisfies ErrorResponsePayload);
};

/**
 * 401 – Unauthorized
 * Authentication required or failed
 */
export const errorHandler__401 = (data: { errorMessage: string; context?: ErrorContext }, res: Response): void => {
  log.warn(
    {
      level: 'warn',
      context: data.context,
      errorMessage: data.errorMessage
    },
    'Unauthorized'
  );

  res.status(401).json({
    responseMessage: data.errorMessage,
    error: 'UNAUTHORIZED'
  } satisfies ErrorResponsePayload);
};

/**
 * 404 – Not Found
 * Resource does not exist
 */
export const errorHandler__404 = (data: { errorMessage: string; context?: ErrorContext }, res: Response): void => {
  log.info(
    {
      level: 'info',
      context: data.context,
      errorMessage: data.errorMessage
    },
    'Not Found'
  );

  res.status(404).json({
    responseMessage: data.errorMessage,
    error: 'NOT_FOUND'
  } satisfies ErrorResponsePayload);
};

/**
 * 400 – Bad Request
 * Client sent invalid input
 */
export const errorHandler__400 = (data: { errorMessage: string; context?: ErrorContext }, res: Response): void => {
  log.info(
    {
      level: 'info',
      context: data.context,
      errorMessage: data.errorMessage
    },
    'Bad Request'
  );

  res.status(400).json({
    responseMessage: data.errorMessage,
    error: 'BAD_REQUEST'
  } satisfies ErrorResponsePayload);
};
