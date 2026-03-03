import { useEffect, useState } from 'react';
import { loadAccount } from '../stellar/stellarConfig';

const containerStyle = {
  borderRadius: '0.75rem',
  border: '1px solid rgba(148,163,184,0.3)',
  padding: '1.5rem',
  background: 'rgba(15,23,42,0.9)',
  boxShadow: '0 18px 45px rgba(15,23,42,0.9)'
};

export default function Balance({ publicKey, onBalanceChange }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBalance = async () => {
    if (!publicKey) {
      setBalance(null);
      setError('');
      onBalanceChange(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const account = await loadAccount(publicKey);
      const native = account.balances.find(b => b.asset_type === 'native');
      const amount = native ? parseFloat(native.balance) : 0;
      setBalance(amount);
      onBalanceChange(amount);
    } catch {
      setError('An error occurred while fetching the balance.');
      setBalance(null);
      onBalanceChange(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [publicKey]);

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af' }}>
            Balance
          </div>
          <div style={{ marginTop: '0.25rem', fontSize: '1.4rem', fontWeight: 600, color: '#e5e7eb' }}>
            {publicKey
              ? loading
                ? 'Loading...'
                : balance !== null
                ? `${balance.toFixed(4)} XLM`
                : 'Unknown'
              : 'Wallet not connected'}
          </div>
        </div>
        <button
          type="button"
          disabled={!publicKey || loading}
          onClick={fetchBalance}
          style={{
            fontSize: '0.8rem',
            borderRadius: '999px',
            padding: '0.45rem 1.1rem',
            border: '1px solid rgba(148,163,184,0.6)',
            background: !publicKey || loading ? '#020617' : 'transparent',
            color: !publicKey || loading ? '#4b5563' : '#d1d5db',
            cursor: !publicKey || loading ? 'not-allowed' : 'pointer'
          }}
        >
          Refresh
        </button>
      </div>
      {error && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#f97373' }}>
          {error}
        </div>
      )}
    </div>
  );
}
