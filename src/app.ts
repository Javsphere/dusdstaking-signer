import express, {ErrorRequestHandler} from 'express';
import {confirmEvmHandler, confirmEvmTranferHandler, signTxsHandler} from "./controllers/signer.controller";
import AppError from "./utils/appError";
import events from "events";
import bodyParser from "body-parser";

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

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

events.EventEmitter.defaultMaxListeners = 100;

app.get('/', (req, res) => {
    res.send('Ready');
});

app.get('/health', (req, res) => {
    res.send('Ready');
});

// GLOBAL ERROR HANDLER
app.use(errorHander);

app.use('/api', router);

app.all('*', (req, _res, next) => {
    next(new AppError(404, `Route ${req.originalUrl} not found`));
});

router.post('/confirmEvmTranfer', confirmEvmTranferHandler);

router.post('/confirmEvm', confirmEvmHandler);

router.post('/signTxs', signTxsHandler);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
