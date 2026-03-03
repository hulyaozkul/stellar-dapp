import { useState } from 'react';
import { Contract, TransactionBuilder } from '@stellar/stellar-sdk';
import { Server } from '@stellar/stellar-sdk/rpc';
import { NETWORK_PASSPHRASE } from '../stellar/stellarConfig';
import { SOROBAN_RPC_URL } from '../stellar/sorobanConfig';
import { getWalletKit } from '../wallet/stellarWalletsKit';

const CONTRACT_ID_PLACEHOLDER = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CONTRACT_ID) || '';

const containerStyle = {
  borderRadius: '0.75rem',
  border: '1px solid rgba(148,163,184,0.3)',
  padding: '1.5rem',
  background: 'rgba(15,23,42,0.9)',
  boxShadow: '0 18px 45px rgba(15,23,42,0.9)'
};

const labelStyle = { fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.35rem' };
const inputStyle = {
  width: '100%',
  borderRadius: '0.6rem',
  border: '1px solid rgba(31,41,55,1)',
  backgroundColor: '#020617',
  padding: '0.6rem 0.75rem',
  color: '#e5e7eb',
  fontSize: '0.9rem',
  outline: 'none'
};

export default function ContractCall({ publicKey }) {
  const [contractId, setContractId] = useState(CONTRACT_ID_PLACEHOLDER);
  const [status, setStatus] = useState('idle');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const handleIncrement = async () => {
    const id = (contractId || '').trim();
    if (!publicKey || !id) {
      setError('Connect wallet and enter a deployed contract ID (C...).');
      return;
    }
    setError('');
    setTxHash('');
    setStatus('pending');
    try {
      const server = new Server(SOROBAN_RPC_URL, { allowHttp: true });
      const account = await server.getAccount(publicKey);
      const contract = new Contract(id);
      const raw = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: NETWORK_PASSPHRASE
      })
        .addOperation(contract.call('increment'))
        .setTimeout(30)
        .build();
      const prepared = await server.prepareTransaction(raw);
      const kit = getWalletKit();
      const preparedXdr = prepared.toXDR();
      const preparedXdrString =
        typeof preparedXdr === 'string' ? preparedXdr : preparedXdr.toString('base64');
      const signResult = await kit.signTransaction(preparedXdrString, {
        address: publicKey,
        networkPassphrase: NETWORK_PASSPHRASE
      });
      if (signResult?.error) {
        throw new Error(signResult.error || 'Transaction was not signed.');
      }
      const signedXdr = signResult.signedTxXdr;
      if (!signedXdr || typeof signedXdr !== 'string') {
        throw new Error('Wallet did not return a signed transaction XDR.');
      }
      const sendResponse = await fetch(`${SOROBAN_RPC_URL}/sendTransaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: signedXdr })
      });
      if (!sendResponse.ok) {
        throw new Error('Transaction submission failed (RPC error).');
      }
      const sendJson = await sendResponse.json();
      if (sendJson.error) {
        const message =
          sendJson.error?.message || sendJson.error?.code || 'Transaction submission failed.';
        throw new Error(message);
      }
      const sendResult = sendJson.result || sendJson;
      if (sendResult.status === 'ERROR' || sendResult.errorResultXdr) {
        setStatus('fail');
        setError('Transaction submission failed.');
        return;
      }
      setTxHash(sendResult.hash);
      const maxAttempts = 20;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, 1500));
        const tx = await server.getTransaction(sendResult.hash);
        if (tx.status === 'SUCCESS') {
          setStatus('success');
          return;
        }
        if (tx.status === 'FAILED') {
          setStatus('fail');
          setError('Transaction failed on chain.');
          return;
        }
      }
      setStatus('success');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Contract call failed', err);
      setStatus('fail');
      const msg = err?.message || '';
      const lower = msg.toLowerCase();
      if (lower.includes('reject') || lower.includes('denied')) {
        setError('The transaction was rejected in your wallet.');
      } else {
        setError(msg || 'Contract call failed.');
      }
    }
  };

  const explorerUrl = txHash
    ? `https://soroban-testnet.stellar.org/transactions/${txHash}`
    : null;

  return (
    <div style={containerStyle}>
      <div style={labelStyle}>Contract (increment)</div>
      <input
        value={contractId}
        onChange={e => setContractId(e.target.value)}
        placeholder="C... (deployed contract ID)"
        style={inputStyle}
      />
      <button
        type="button"
        disabled={!publicKey || !contractId?.trim() || status === 'pending'}
        onClick={handleIncrement}
        style={{
          marginTop: '0.75rem',
          width: '100%',
          borderRadius: '0.75rem',
          padding: '0.6rem 1rem',
          fontSize: '0.9rem',
          fontWeight: 500,
          border: 'none',
          cursor: !publicKey || !contractId?.trim() || status === 'pending' ? 'not-allowed' : 'pointer',
          background:
            status === 'pending'
              ? '#1e293b'
              : status === 'success'
                ? 'linear-gradient(135deg,#059669,#10b981)'
                : status === 'fail'
                  ? 'linear-gradient(135deg,#b91c1c,#dc2626)'
                  : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: '#f9fafb',
          opacity: !publicKey || !contractId?.trim() || status === 'pending' ? 0.8 : 1
        }}
      >
        {!publicKey
          ? 'Connect wallet first'
          : status === 'pending'
            ? 'Pending…'
            : status === 'success'
              ? 'Success'
              : status === 'fail'
                ? 'Failed'
                : 'Increment counter'}
      </button>
      {(error || explorerUrl) && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
          {error && <div style={{ color: '#f97373' }}>{error}</div>}
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#a5b4fc', textDecoration: 'underline', wordBreak: 'break-all' }}
            >
              View on Stellar Explorer
            </a>
          )}
        </div>
      )}
    </div>
  );
}
