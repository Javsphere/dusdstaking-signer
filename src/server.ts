import express from 'express';
import {confirmEvmHandler, confirmEvmTranferHandler, signTxsHandler} from "./controllers/signer.controller";

const app = express();
const router = express.Router();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Ready');
});

app.get('/health', (req, res) => {
    res.send('Ready');
});

router.post('/confirmEvmTranfer', confirmEvmTranferHandler);

router.post('/confirmEvm', confirmEvmHandler);

router.post('/signTxs', signTxsHandler);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
