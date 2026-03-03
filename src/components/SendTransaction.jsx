import { useState } from 'react';
import { TransactionBuilder, Operation, Asset, Account } from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import {
  NETWORK_PASSPHRASE,
  isValidPublicKey,
  loadAccount,
  fetchBaseFee,
  submitTransactionXdr
} from '../stellar/stellarConfig';

const containerStyle = {
  borderRadius: '0.75rem',
  border: '1px solid rgba(148,163,184,0.3)',
  padding: '1.5rem',
  background: 'rgba(15,23,42,0.9)',
  boxShadow: '0 18px 45px rgba(15,23,42,0.9)'
};

const labelStyle = {
  fontSize: '0.8rem',
  color: '#9ca3af',
  marginBottom: '0.35rem'
};

const inputStyle = invalid => ({
  width: '100%',
  borderRadius: '0.6rem',
  border: `1px solid ${invalid ? '#f97373' : 'rgba(31,41,55,1)'}`,
  backgroundColor: '#020617',
  padding: '0.6rem 0.75rem',
  color: '#e5e7eb',
  fontSize: '0.9rem',
  outline: 'none'
});

const helperStyle = {
  fontSize: '0.75rem',
  color: '#6b7280',
  marginTop: '0.25rem'
};

export default function SendTransaction({ publicKey, balance }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [recipientError, setRecipientError] = useState('');
  const [amountError, setAmountError] = useState('');

  const parsedAmount = () => {
    const value = parseFloat(amount.replace(',', '.'));
    if (Number.isNaN(value)) return null;
    return value;
  };

  const validateFields = () => {
    let ok = true;
    setRecipientError('');
    setAmountError('');
    if (!recipient || !isValidPublicKey(recipient)) {
      setRecipientError('Please enter a valid Stellar address.');
      ok = false;
    }
    const value = parsedAmount();
    if (value === null || value <= 0) {
      setAmountError('Please enter a valid amount.');
      ok = false;
    } else if (typeof balance === 'number' && value > balance) {
      setAmountError('Amount cannot be greater than your balance.');
      ok = false;
    }
    return ok;
  };

  const disabled =
    !publicKey ||
    submitting ||
    !amount ||
    !recipient ||
    !parsedAmount() ||
    (typeof balance === 'number' && parsedAmount() > balance);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!publicKey || !validateFields()) return;
    setSubmitting(true);
    setError('');
    setSuccessMessage('');
    setTxHash('');
    try {
      const accountData = await loadAccount(publicKey);
      const account = new Account(accountData.id, accountData.sequence);
      const fee = await fetchBaseFee();
      const value = parsedAmount().toFixed(7);
      const tx = new TransactionBuilder(account, {
        fee: fee.toString(),
        networkPassphrase: NETWORK_PASSPHRASE
      })
        .addOperation(
          Operation.payment({
            destination: recipient.trim(),
            asset: Asset.native(),
            amount: value
          })
        )
        .setTimeout(30)
        .build();

      const xdr = tx.toXDR();

      const TIMEOUT_MS = 120000;
      const signWithTimeout = async () => {
        const result = await Promise.race([
          signTransaction(xdr, { networkPassphrase: NETWORK_PASSPHRASE }),
          new Promise((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    'Transaction signing timed out. Please approve or reject the request in the Freighter extension.'
                  )
                ),
              TIMEOUT_MS
            )
          )
        ]);
        if (!result || result.error) {
          throw new Error(result?.error || 'Transaction was not signed in Freighter.');
        }
        return result.signedTxXdr;
      };

      const signedXdr = await signWithTimeout();
      const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
      const result = await submitTransactionXdr(signedTx.toXDR());
      setTxHash(result.hash);
      setSuccessMessage('Transaction submitted successfully.');
      setAmount('');
    } catch (err) {
      const msg = err?.message || '';
      const detail =
        err?.response?.detail ||
        err?.response?.extras?.result_codes?.transaction ||
        '';
      const horizonMsg =
        typeof detail === 'string'
          ? detail
          : detail
          ? JSON.stringify(detail)
          : '';
      const display =
        horizonMsg || msg || 'An error occurred while submitting the transaction.';
      setError(display);
    } finally {
      setSubmitting(false);
    }
  };

  const explorerUrl = txHash
    ? `https://testnet.steexp.com/tx/${txHash}`
    : null;

  return (
    <div style={containerStyle}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div>
          <div style={labelStyle}>Recipient address</div>
          <input
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            placeholder="G..."
            style={inputStyle(!!recipientError)}
          />
          <div style={helperStyle}>
            Enter a Stellar testnet wallet address.
          </div>
          {recipientError && (
            <div style={{ fontSize: '0.75rem', color: '#f97373', marginTop: '0.25rem' }}>
              {recipientError}
            </div>
          )}
        </div>
        <div>
          <div style={labelStyle}>Amount (XLM)</div>
          <input
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.0000001"
            style={inputStyle(!!amountError)}
          />
          <div style={helperStyle}>
            {typeof balance === 'number' ? `Available: ${balance.toFixed(4)} XLM` : 'Balance information is not available.'}
          </div>
          {amountError && (
            <div style={{ fontSize: '0.75rem', color: '#f97373', marginTop: '0.25rem' }}>
              {amountError}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled}
          style={{
            marginTop: '0.5rem',
            width: '100%',
            borderRadius: '0.75rem',
            padding: '0.7rem 1rem',
            fontSize: '0.95rem',
            fontWeight: 500,
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            background: disabled
              ? 'linear-gradient(135deg,#020617,#020617)'
              : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: disabled ? '#4b5563' : '#f9fafb',
            boxShadow: disabled ? 'none' : '0 16px 35px rgba(79,70,229,0.5)'
          }}
        >
          {!publicKey
            ? 'Connect your wallet first'
            : submitting
            ? 'Submitting...'
            : 'Send'}
        </button>
      </form>
      {(error || successMessage || explorerUrl) && (
        <div style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
          {successMessage && (
            <div style={{ color: '#bbf7d0', marginBottom: '0.35rem' }}>
              {successMessage}
            </div>
          )}
          {error && (
            <div style={{ color: '#f97373', marginBottom: '0.35rem' }}>
              {error}
            </div>
          )}
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#a5b4fc', textDecoration: 'underline', wordBreak: 'break-all' }}
            >
              Transaction details (Stellar Expert)
            </a>
          )}
        </div>
      )}
    </div>
  );
}
