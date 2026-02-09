import log from '../logger.js';

export const customServiceErrorHandler = (error: any) => {
  if (error instanceof Error) {
    log.error({ level: 'error', error: error.message }, 'Error occurred');

    throw new Error(error.message);
  } else {
    log.error({ level: 'error', error }, 'Error occurred');

    throw new Error('internal server error');
  }
};
