import { WhaleWalletAccount } from '@defichain/whale-api-wallet';
import { BigNumber } from '@defichain/jellyfish-api-core';
import { NetworkName } from '@defichain/jellyfish-network';
import { CTransactionSegWit } from '@defichain/jellyfish-transaction';
import { Prevout } from '@defichain/jellyfish-transaction-builder';

export interface TransferDomainSigner {
  account: WhaleWalletAccount;
  tokenId: number;
  amount: BigNumber;
  convertDirection: ConvertDirection;
  dvmAddress: string;
  evmAddress: string;
  chainId?: number;
  networkName: NetworkName;
  nonce: number;
}

export const TRANSFER_DOMAIN_TYPE = {
  DVM: 2,
  EVM: 3,
};

export enum ConvertDirection {
  evmToDvm = 'evmToDvm',
  dvmToEvm = 'dvmToEvm',
  utxosToAccount = 'utxosToAccount',
  accountToUtxos = 'accountToUtxos',
}

export interface EvmTxSigner {
  isEvmToDvm: boolean;
  tokenId: number;
  amount: BigNumber;
  dvmAddress: string;
  evmAddress: string;
  accountEvmAddress: string;
  privateKey: Buffer;
  chainId?: number;
  nonce: number;
}

export interface jobDataBuy {
  dtokenId: string;
  addressBuyer: string;
  dusdAmount: string;
}
export interface EvmMultisig {
  randomId: string;
  transactionId: string;
}

export interface SignPackageMultisig {
  transaction: CTransactionSegWit;
  prevout: Prevout;
}

export interface SignTXsPackage {
  transactions: SignPackageMultisig[],
  prevPubKey: string,
  redeemScript: string
}

export interface SignedTXsPackage {
  transactions: CTransactionSegWit[],
}


export const TD_CONTRACT_ADDR = '0xdf00000000000000000000000000000000000001';
