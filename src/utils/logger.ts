import { SeqTransport } from '@datalust/winston-seq';
import winston from 'winston';
import process from 'process';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    /* This is required to get errors to log with stack traces. See https://github.com/winstonjs/winston/issues/1498 */
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    application: process.env.NAME,
  },
  transports: [
    new winston.transports.Console({
      level: 'debug',
      handleExceptions: true,
    }),
    new SeqTransport({
      serverUrl: 'https://log.defichain-income.com',
      apiKey: 'Ge7TCds2jfNU47r9rImZ',
      onError: (e) => {
        console.error(e);
      },
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
  exitOnError: false,
});

export default logger;
