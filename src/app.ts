import express, {ErrorRequestHandler} from 'express';
import {confirmEvmHandler, confirmEvmTranferHandler, signTxsHandler} from "./controllers/signer.controller";
import events from "events";
import cors from 'cors';
import httpLogger from "./utils/httpLogger";
import logger from "./utils/logger";
import process from "process";
import packageFile from '../package.json';
import AppError from "./utils/appError";

const errorHander: ErrorRequestHandler = (error: AppError, _req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    error.status = error.status || 'error';
    error.statusCode = error.statusCode || 500;

    res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
    });
};

const app = express();
const router = express.Router();
const port = 3000;

// Remove this and req.rawBody will no longer be accessible.
declare module 'http' {
    interface IncomingMessage {
        rawBody: unknown;
    }
}

// 1. Body parser
app.use(express.json({ limit: '10mb' }));

// 2. Logger
app.use(httpLogger);

app.use(cors());

// GLOBAL ERROR HANDLER
app.use(errorHander);

events.EventEmitter.defaultMaxListeners = 100;

app.get('/', (req, res) => {
    res.send({
        "version": packageFile.version,
        "status": 'Ready'
    });
});

app.get('/health', (req, res) => {
    res.send({
        "version": packageFile.version,
        "status": 'Ready'
    });
});

app.use('/api', router);

router.post('/confirmEvmTranfer', confirmEvmTranferHandler);

router.post('/confirmEvm', confirmEvmHandler);

router.post('/signTxs', signTxsHandler);

app.listen(port, () => {
    logger.info(`Server version ${packageFile.version}`);
    logger.info(`Server ${process.env.NAME} is running at http://localhost:${port}`);
});
