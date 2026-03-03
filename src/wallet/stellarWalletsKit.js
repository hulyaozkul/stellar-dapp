import {
  StellarWalletsKit,
  WalletNetwork,
  FreighterModule,
  xBullModule
} from '@creit.tech/stellar-wallets-kit';

let kitInstance = null;

export const getWalletKit = () => {
  if (!kitInstance) {
    kitInstance = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      modules: [new FreighterModule(), new xBullModule()]
    });
  }
  return kitInstance;
};

