import { Networks, StrKey } from '@stellar/stellar-sdk';

export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const NETWORK_PASSPHRASE = Networks.TESTNET;

export const isValidPublicKey = value => {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  try {
    return StrKey.isValidEd25519PublicKey(trimmed);
  } catch {
    return false;
  }
};

export const loadAccount = async publicKey => {
  const url = `${HORIZON_URL}/accounts/${encodeURIComponent(publicKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to load account');
  }
  return res.json();
};

export const fetchBaseFee = async () => {
  try {
    const res = await fetch(`${HORIZON_URL}/fee_stats`);
    if (!res.ok) {
      throw new Error('Failed to fetch fee stats');
    }
    const data = await res.json();
    const mode = parseInt(data.fee_charged?.mode, 10);
    return Number.isFinite(mode) && mode > 0 ? mode : 100;
  } catch {
    return 100;
  }
};

export const submitTransactionXdr = async xdr => {
  const res = await fetch(`${HORIZON_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
    },
    body: `tx=${encodeURIComponent(xdr)}`
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error('Transaction submission failed');
    error.response = data;
    throw error;
  }
  return data;
};
