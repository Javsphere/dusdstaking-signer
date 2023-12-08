import morgan from 'morgan';
import json from 'morgan-json';

const format = json({
  method: ':method',
  url: ':url',
  status: ':status',
  contentLength: ':res[content-length]',
  responseTime: ':response-time',
});

import logger from './logger';
const httpLogger = morgan(format, {
  stream: {
    write: (message) => {
      const { method, url, status, contentLength, responseTime } =
        JSON.parse(message);

      logger.info(
        `HTTP Access Log: ${method} - ${url} - ${status} - ${responseTime}ms`,
        {
          timestamp: new Date().toString(),
          method,
          url,
          status: Number(status),
          contentLength,
          responseTime: Number(responseTime),
        }
      );
    },
  },
});

export default httpLogger;
