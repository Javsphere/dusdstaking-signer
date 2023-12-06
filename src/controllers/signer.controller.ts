import { RequestHandler } from 'express';
import {EvmMultisig, SignedTXsPackage, SignTXsPackage} from "src/libs/types/blockchain.types";
import {
  confirmEvmMultisigTransactionTransfer,
  confirmEVMMultisigTransacton,
  signTxs
} from "../dusdStakingSigner";

export const confirmEvmTranferHandler: RequestHandler<unknown,  unknown, EvmMultisig>
    = async (req, res, next) => {
  try {

    const { randomId, transactionId } = req.body;
    console.log(" Start signing with confirmEvmMultisigTransactionTransfer ... ")
    await confirmEvmMultisigTransactionTransfer(randomId, transactionId);
    console.log(" Signing with confirmEvmMultisigTransactionTransfer ready. ")
    res.status(200).status(200).json({
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
    console.log(" Start signing with confirmEVMMultisigTransacton ... ")
    await confirmEVMMultisigTransacton(randomId, transactionId);
    console.log(" Signing with confirmEVMMultisigTransacton ready. ")

    res.status(200).status(200).json({
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
    console.log(" Start signing with signTxs ... ")
    const signed = await signTxs(transactions, prevPubKey, redeemScript);
    console.log(" Signing with signTxs ready. ")

    res.status(200).status(200).json({
      transactions: signed
    });
  } catch (err) {
    next(err);
  }
};
