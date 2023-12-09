import { RequestHandler } from 'express';
import {EvmMultisig, SignedTXsPackage, SignTXsPackage} from "src/libs/types/blockchain.types";
import {
  confirmEvmMultisigTransactionTransfer,
  confirmEVMMultisigTransacton,
  signTxs
} from "../dusdStakingSigner";
import logger from "../utils/logger";

export const confirmEvmTranferHandler: RequestHandler<unknown,  unknown, EvmMultisig>
    = async (req, res, next) => {
  try {

    const { randomId, transactionId } = req.body;
    const transactionString = JSON.stringify(transactionId);
    logger.info(` ${randomId} Start signing ${transactionString} with confirmEvmMultisigTransactionTransfer ... `)
    const tx = await confirmEvmMultisigTransactionTransfer(randomId, transactionId);
    logger.info(` ${randomId} Signing ${transactionString}  with confirmEvmMultisigTransactionTransfer ready. ` )
    res.status(200).json({
      tx,
      status: 'sent',
      message: `Data ${randomId} and ${transactionString}`,

    });
  } catch (err) {
    next(err);
  }
};

export const confirmEvmHandler: RequestHandler<unknown,  unknown, EvmMultisig>
    = async (req, res, next) => {
  try {

    const { randomId, transactionId } = req.body;
    const transactionString = JSON.stringify(transactionId);
    logger.info(` ${randomId} Start signing ${transactionString} with confirmEVMMultisigTransacton ... `)
    const tx = await confirmEVMMultisigTransacton(randomId, transactionId);
    logger.info(` ${randomId} Signing with ${transactionString}  confirmEVMMultisigTransacton ready. `)

    res.status(200).json({
      tx,
      status: 'sent',
      message: `Data ${randomId} and ${transactionString}`,

    });
  } catch (err) {
    next(err);
  }
};

export const signTxsHandler: RequestHandler<unknown,  SignedTXsPackage, SignTXsPackage>
    = async (req, res, next) => {
  try {

    const { transactions, prevPubKey, redeemScript } = req.body;
    logger.info(` Start signing with signTxs ... `)
    const signed = await signTxs(transactions, prevPubKey, redeemScript);
    logger.info(` Signing  with signTxs ready. `)

    res.status(200).json({
      transactions: signed
    });
  } catch (err) {
    next(err);
  }
};
