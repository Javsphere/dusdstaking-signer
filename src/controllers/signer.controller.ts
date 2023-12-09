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
    logger.info(` ${new Date().toString()} ${randomId} Start signing ${transactionId} with confirmEvmMultisigTransactionTransfer ... `)
    await confirmEvmMultisigTransactionTransfer(randomId, transactionId);
    logger.info(` ${new Date().toString()} ${randomId} Signing ${transactionId}  with confirmEvmMultisigTransactionTransfer ready. ` )
    res.status(200).json({
      status: 'confirmed',
      message: `Data ${randomId} and ${transactionId}`,

    });
  } catch (err) {
    next(err);
  }
};

export const confirmEvmHandler: RequestHandler<unknown,  unknown, EvmMultisig>
    = async (req, res, next) => {
  try {

    const { randomId, transactionId } = req.body;
    logger.info(` ${new Date().toString()} ${randomId} Start signing ${transactionId} with confirmEVMMultisigTransacton ... `)
    await confirmEVMMultisigTransacton(randomId, transactionId);
    logger.info(` ${new Date().toString()} ${randomId} Signing with ${transactionId}  confirmEVMMultisigTransacton ready. `)

    res.status(200).json({
      status: 'confirmed',
      message: `Data ${randomId} and ${transactionId}`,

    });
  } catch (err) {
    next(err);
  }
};

export const signTxsHandler: RequestHandler<unknown,  SignedTXsPackage, SignTXsPackage>
    = async (req, res, next) => {
  try {

    const { transactions, prevPubKey, redeemScript } = req.body;
    logger.info(` ${new Date().toString()} Start signing with signTxs ... `)
    const signed = await signTxs(transactions, prevPubKey, redeemScript);
    logger.info(` ${new Date().toString()} Signing  with signTxs ready. `)

    res.status(200).json({
      transactions: signed
    });
  } catch (err) {
    next(err);
  }
};
