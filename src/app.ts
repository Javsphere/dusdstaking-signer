import express, {ErrorRequestHandler} from 'express';
import {confirmEvmHandler, confirmEvmTranferHandler, signTxsHandler} from "./controllers/signer.controller";
import AppError from "./utils/appError";
import events from "events";
import bodyParser from "body-parser";
import cors from 'cors';

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

app.use(cors());

events.EventEmitter.defaultMaxListeners = 100;

app.get('/', (req, res) => {
    res.send({
        "status": 'Ready'
    });
});

app.get('/health', (req, res) => {
    res.send({
        "status": 'Ready'
    });
});

app.use('/api', router);

router.post('/confirmEvmTranfer', confirmEvmTranferHandler);

router.post('/confirmEvm', confirmEvmHandler);

router.post('/signTxs', signTxsHandler);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
