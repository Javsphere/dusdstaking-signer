import { WalletClassic } from '@defichain/jellyfish-wallet-classic';
import { WIF } from '@defichain/jellyfish-crypto';
import { WhaleWalletAccount } from '@defichain/whale-api-wallet';
import {ethers, providers} from 'ethers';
import MultisigWallet from 'src/libs/dmc/MultiSigWallet.json';
import { WhaleApiClient } from '@defichain/whale-api-client';
import { TestNet, MainNet } from '@defichain/jellyfish-network';
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
import logger from "./utils/logger";
import process from "process";

const dusdTokenAddress = process.env.ENV === 'prod' ? '0xFf0000000000000000000000000000000000000F' : '0xFF0000000000000000000000000000000000000B';

const rpc = process.env.ENV === 'prod'
    ? 'https://eth.mainnet.ocean.jellyfishsdk.com/'
    : 'https://eth.testnet.ocean.jellyfishsdk.com/';

const multisigWalletSCAddress = process.env.ENV === 'prod'
    ? '0xe0cfb44cD4a1137fE7B1c6B495D1c6e19140ECe5'
    : '0x55e762e808745C2fa6FbC751653e14A8B9e7aDd4';

const dusdStakingSCAddress = process.env.ENV === 'prod'
    ? '0x69732876393acD817fA8F7330837cB7C4D5D9f7E'
    :'0x16AD8BC8ed24481fEBEde9BE128ad80243942E28';

const multiSigAddress =  process.env.ENV === 'prod'
        ? 'df1q7zkdpw6hd5wzcxudx28k72vjvpefa4pyqls2grnahhyw4u8kf0zqu2cnz6'
        : 'tf1qtrf6nrttse02e2687aqml6l4lmdg599tsmhq29ey4aj05fzdetrsswzjv2';


const transferDomainAddress =  process.env.ENV === 'prod'
    ? "df1qc3utnuqg3t465khdn6ejhe2fwn3eacd84lw8kh"
    : "tf1qmwl3z8dw3ljq7q729mut8fu0m24p8ncz8f46sx";


const transferDomainAddressEVM =  process.env.ENV === 'prod'
    ? "0x5B339C55eD738c47f5fd6D472b41ec878910AB69"
    : "0x2683f524C6477a3D84c6d1492a1b51e0B4146d36";

const overrides = {
  gasLimit: ethers.BigNumber.from('20000000'),
  maxFeePerGas: ethers.utils.parseUnits('50', 'gwei'),
  maxPriorityFeePerGas: 0
};

const allowedTargetsForTransfer = [
  transferDomainAddressEVM,
  dusdStakingSCAddress,
];

const allowedTargetsDVM = [
  transferDomainAddress,
  multiSigAddress,
];

const evmProvider = new providers.JsonRpcProvider(rpc);
const network =  process.env.ENV === 'prod' ? MainNet : TestNet;
let ocean: WhaleApiClient = process.env.ENV === 'prod' ? getProdWhaleClient() : getTestWhaleClient() ;

export async function confirmEvmMultisigTransactionTransfer(
  randomId: string,
  transactionId: string
): Promise<string> {
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

  logger.info(
    ` ${new Date().toString()} ${randomId} Transaction Details - To: ${toAddress}, Value: ${toAddressDusdValue}`
  );

  // Confirm the correct target address
  if (!allowedTargetsForTransfer.includes(toAddress)) {
    const errorMessage = `${randomId} Error in confirm transaction ${JSON.stringify(transactionId)} not allowed address ${toAddress}.`;
    throw new Error(`${errorMessage}`);
  }

  const txResponse2 = await multiSigWalletContract.confirmTransaction(
    transactionId,
    overrides
  );
  logger.info(
    ` ${new Date().toString()} ${randomId} Confirmation Transaction ${JSON.stringify(transactionId)}  sent with hash: ${txResponse2.hash}`
  );
  return txResponse2.hash;
}

export async function confirmEVMMultisigTransacton(
  randomId: string,
  transactionId: string
): Promise<string> {
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
  logger.info(
      ` ${new Date().toString()} ${randomId} Confirmation Transaction ${JSON.stringify(transactionId)} sent with hash: ${txResponse.hash}`
  );
  return txResponse.hash;
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
    verified = verifyTargetAddresses(tx.transaction, allowedTargetsDVM);

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
  const insertPosition = process.env.ENV === 'prod' ? 1 : witnessScripts.length - 1;

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
        logger.info('got a2a');
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

export function getProdWhaleClient(): WhaleApiClient {
  return new WhaleApiClient({
    url: 'https://mainnet.ocean.jellyfishsdk.com',
    timeout: 120000,
    version: 'v0',
    network: network.name,
  });
}

