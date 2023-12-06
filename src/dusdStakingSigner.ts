import { WalletClassic } from '@defichain/jellyfish-wallet-classic';
import { WIF } from '@defichain/jellyfish-crypto';
import { WhaleWalletAccount } from '@defichain/whale-api-wallet';
import { ethers, providers } from 'ethers';
import MultisigWallet from 'src/libs/dmc/MultiSigWallet.json';
import { WhaleApiClient } from '@defichain/whale-api-client';
import { TestNet } from '@defichain/jellyfish-network';
import DST20_V1 from 'src/libs/dmc/DST20_V1.json';
import {
  AccountToAccount,
  CAccountToAccount,
  CTransaction,
  CTransactionSegWit,
  DeFiTransactionConstants,
  OP_DEFI_TX,
  TakeLoan,
  toOPCodes,
  Transaction,
  TransactionSegWit,
  WitnessScript,
} from '@defichain/jellyfish-transaction';
import { fromScript } from '@defichain/jellyfish-address';
import { Prevout } from '@defichain/jellyfish-transaction-builder';
import {
  SignInputOption,
  TransactionSigner,
} from '@defichain/jellyfish-transaction-signature';
import { SmartBuffer } from 'smart-buffer';
import {SignPackageMultisig, SignPackageMultisigTransport} from 'src/libs/types/blockchain.types';
import {
  CWithdrawFromVault,
  WithdrawFromVault,
} from '@defichain/jellyfish-transaction/dist/script/dftx/dftx_vault';
import { CTakeLoan } from '@defichain/jellyfish-transaction/dist/script/dftx/dftx_loans';
import 'dotenv/config';
import {BigNumber} from "@defichain/jellyfish-api-core";

const multiSigAddress2 = 'tf1qkm5y2xahw6ht5v449xna3fwulutfkstx89pn0s';
const rpc = 'https://dmc.mydefichain.com/testnet';
const multisigWalletSCAddress = '0x2A9f89782B7d3c14a6D5b253c2E059e3572716dc';
const dusdStakingSCAddress = '0xdB476F0C4Bc8Ced2F5d02af84fce5B1FF84039fe';
const dusdTokenAddress = '0xFF0000000000000000000000000000000000000B';
const multiSigAddress =
  'tf1qtrf6nrttse02e2687aqml6l4lmdg599tsmhq29ey4aj05fzdetrsswzjv2';

const overrides = {
  gasLimit: ethers.BigNumber.from('3000000'),
};

const allowedTargetsForTransfer = [
  '0x64F67fdC8c237004794090AE541581932E9A622E',
  dusdStakingSCAddress,
];

const evmProvider = new providers.JsonRpcProvider(rpc);

let ocean: WhaleApiClient;
const network = TestNet;

export async function confirmEvmMultisigTransactionTransfer(
  randomId: string,
  transactionId: string
) {
  const priv2 = process.env.PRIV_KEY!;
  const wallet2 = new WalletClassic(WIF.asEllipticPair(priv2));
  const account2 = new WhaleWalletAccount(ocean, wallet2, network);
  const secondOwnerWallet = new ethers.Wallet(
    await account2.privateKey(),
    evmProvider
  );
  const multiSigWalletContract = new ethers.Contract(
    multisigWalletSCAddress,
    MultisigWallet.abi,
    secondOwnerWallet
  );

  const tokenContract = new ethers.Contract(
    dusdTokenAddress,
    DST20_V1.abi,
    secondOwnerWallet
  );

  // decode for transfer targets check
  const transaction = await multiSigWalletContract.transactions(transactionId);
  const decoded = tokenContract.interface.decodeFunctionData(
    'transfer',
    transaction.data
  );
  const toAddress = decoded[0];
  const toAddressDusdValue = ethers.utils.formatEther(decoded[1]);

  console.info(
    `${randomId} Transaction Details - To: ${toAddress}, Value: ${toAddressDusdValue}`
  );

  // Confirm the correct target address
  if (!allowedTargetsForTransfer.includes(toAddress)) {
    const errorMessage = `${randomId} Error in confirm transaction ${transactionId} not allowed address ${toAddress}.`;
    throw new Error(`${errorMessage}`);
  }

  const txResponse2 = await multiSigWalletContract.confirmTransaction(
    transactionId,
    overrides
  );
  console.info(
    `${randomId} Confirmation Transaction sent with hash: ${txResponse2.hash}`
  );
  await txResponse2.wait();
  console.info(
    `${randomId} Transaction confirmed with hash: ${txResponse2.hash}`
  );
}

export async function confirmEVMMultisigTransacton(
  randomId: string,
  transactionId: string
) {
  ocean = getTestWhaleClient();
  const evmProvider = new providers.JsonRpcProvider(rpc);

  const priv2 = process.env.PRIV_KEY!;
  const wallet2 = new WalletClassic(WIF.asEllipticPair(priv2));
  const account2 = new WhaleWalletAccount(ocean, wallet2, network);
  const secondOwnerWallet = new ethers.Wallet(
    await account2.privateKey(),
    evmProvider
  );
  const multiSigWalletContractSecondOwner = new ethers.Contract(
    multisigWalletSCAddress,
    MultisigWallet.abi,
    secondOwnerWallet
  );

  const txResponse = await multiSigWalletContractSecondOwner.confirmTransaction(
      transactionId,
      overrides
  );
  console.info(
      `${randomId} Confirmation Transaction sent with hash: ${txResponse.hash}`
  );
  await txResponse.wait();
  console.info(
      `${randomId} Transaction confirmed with hash: ${txResponse.hash}`
  );
}

export async function signTxs(
  transactionsTransport: SignPackageMultisigTransport[],
  prevPubKey: string,
  redeemScript: string
): Promise<string[]> {
  const priv = process.env.PRIV_KEY!;

  const transactions: SignPackageMultisig [] = [];

  for (const rawTx of transactionsTransport) {
    const txn = new CTransactionSegWit(SmartBuffer.fromBuffer(Buffer.from(rawTx.transaction, 'hex')));
    const prevout = rawTx.prevout;
    prevout.value = new BigNumber(rawTx.prevout.value)
    transactions.push({transaction: txn, prevout })
  }

  const allowedTargets = [
    'tf1q5hf30t5yxp5avzh2mw0yccwtvjqy5l2f3seyc4',
    multiSigAddress,
  ];

  const allowedOpCodes = [
    'OP_DEFI_TX_DEPOSIT_TO_VAULT',
    'OP_DEFI_TX_TAKE_LOAN',
    'OP_DEFI_TX_PAYBACK_LOAN',
    'OP_DEFI_TX_WITHDRAW_FROM_VAULT',
    'OP_DEFI_TX_ACCOUNT_TO_ACCOUNT',
  ];

  const opcodes = extractOpCodes(transactions);

  // verify opCodes
  opcodes.forEach((op) => {
    if (!allowedOpCodes.includes(op)) {
      const errorMessage = `Error in confirm DVM transaction ${op} not allowed.`;
      throw new Error(`${errorMessage}`);
    }
  });

  let verified = true;
  transactions.forEach((tx) => {
    verified = verifyTargetAddresses(tx.transaction, allowedTargets);

    if (!verified) {
      const errorMessage = `Error in verify DVM transaction ${JSON.stringify(
        tx
      )} not allowed.`;
      throw new Error(`${errorMessage}`);
    }
  });

  const signedTxs: string [] = [];

  for (const tx of transactions) {
    const witnesses = [];
    //Sign with first
    witnesses.push(
      await getWittness(
        tx.transaction,
        tx.prevout,
        prevPubKey,
        priv,
        redeemScript
      )
    );
    const signed: TransactionSegWit = createConfirmationSignedTx(
      tx.transaction,
      witnesses
    );
    const ctx = new CTransactionSegWit(signed);
    signedTxs.push(ctx.toHex());
  }

  return signedTxs;
}

async function getWittness(
  transaction: CTransactionSegWit,
  prevout: Prevout,
  pubKey: string,
  privKey: string,
  redeemScript: string
): Promise<WitnessScript> {
  const wep = WIF.asEllipticPair(privKey);
  const inputOption: SignInputOption = {
    prevout: prevout,
    publicKey: async () => Buffer.from(pubKey, 'hex'),
    sign: async (hash) => await wep.sign(hash),
    witnessScript: {
      stack: toOPCodes(
        SmartBuffer.fromBuffer(Buffer.from(redeemScript, 'hex'))
      ),
    },
  };

  const signed = await TransactionSigner.sign(transaction, [inputOption]);

  return signed.witness[0].scripts[0];
}

export function createConfirmationSignedTx(
  transaction: CTransactionSegWit,
  witnesses: WitnessScript[]
): TransactionSegWit {
  // insert new witness before redeem script
  const witnessScripts = transaction.witness[0].scripts;
  const insertPosition = witnessScripts.length - 1;
  witnessScripts.splice(insertPosition, 0, ...witnesses);

  return {
    version: transaction.version,
    marker: DeFiTransactionConstants.WitnessMarker,
    flag: DeFiTransactionConstants.WitnessFlag,
    vin: transaction.vin,
    vout: transaction.vout,
    witness: [
      {
        scripts: witnessScripts,
      },
    ],
    lockTime: transaction.lockTime,
  };
}

//_====================== HELPER =======================

export function prevOutFromTx(tx: CTransaction): Prevout {
  return {
    txid: tx.txId,
    vout: 1,
    value: tx.vout[1].value,
    script: tx.vout[1].script,
    tokenId: tx.vout[1].tokenId,
  };
}

function verifyTargetAddresses(
  txn: Transaction,
  allowedAddresses: string[]
): boolean {
  //how to get data and show it to the user:
  const defiStack = txn.vout[0].script.stack[1];

  if (defiStack.type === 'OP_DEFI_TX') {
    const dftx = (defiStack as OP_DEFI_TX).tx;
    let target;

    switch (dftx.type) {
      case CAccountToAccount.OP_CODE:
        console.log('got a2a');
        const a2a = dftx.data as AccountToAccount;
        target = a2a.to
          .map(
            (to): string => `${fromScript(to.script, network.name)?.address}`
          )
          .join('\n');

        return allowedAddresses.includes(target);
      case CWithdrawFromVault.OP_CODE:
        const wfv = dftx.data as WithdrawFromVault;
        target = fromScript(wfv.to, network.name)?.address!;

        return allowedAddresses.includes(target);
      case CTakeLoan.OP_CODE:
        const tl = dftx.data as TakeLoan;
        target = fromScript(tl.to, network.name)?.address!;

        return allowedAddresses.includes(target);
      default:
        return true;
    }
  } else {
    return false;
  }
}

function extractOpCodes(txns: SignPackageMultisig[]): any[] {
  const opCodes: any[] = [];

  for (const txn of txns) {
    //how to get data and show it to the user:
    const defiStack = txn.transaction.vout[0].script.stack[1];

    if (defiStack.type === 'OP_DEFI_TX') {
      const dftx = (defiStack as OP_DEFI_TX).tx;

      if (!opCodes.includes(dftx.name)) {
        opCodes.push(dftx.name);
      }
    }
  }

  return opCodes;
}

export function getTestWhaleClient(): WhaleApiClient {
  return new WhaleApiClient({
    url: 'https://testnet.ocean.jellyfishsdk.com',
    timeout: 120000,
    version: 'v0',
    network: network.name,
  });
}
