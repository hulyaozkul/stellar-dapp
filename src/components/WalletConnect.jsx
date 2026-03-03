import { useState } from 'react';
import { getWalletKit } from '../wallet/stellarWalletsKit';

const containerStyle = {
  borderRadius: '0.75rem',
  border: '1px solid rgba(148,163,184,0.3)',
  padding: '1.5rem',
  background:
    'radial-gradient(circle at top left, rgba(79,70,229,0.35), transparent 55%), rgba(15,23,42,0.9)',
  boxShadow: '0 18px 45px rgba(15,23,42,0.9)'
};

export default function WalletConnect({ publicKey, onConnect, onDisconnect }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [selectedWalletName, setSelectedWalletName] = useState('');

  const shortKey = key =>
    key ? `${key.slice(0, 6)}...${key.slice(-6)}` : '';

  const handleConnect = async () => {
    setError('');
    setStatus('');
    setLoading(true);
    try {
      const kit = getWalletKit();

      await kit.openModal({
        onWalletSelected: async option => {
          try {
            await kit.setWallet(option.id);
            setSelectedWalletName(option.name || option.id || '');
            const { address } = await kit.getAddress();
            if (!address) {
              setError('Wallet address could not be retrieved.');
              return;
            }
            onConnect(address);
            setStatus('Wallet connected.');
          } catch (innerErr) {
            const msg =
              innerErr?.message ||
              'The wallet rejected the request or is not available.';
            setError(msg);
          } finally {
            setLoading(false);
          }
        }
      });
      // openModal may resolve without selecting a wallet
      if (!publicKey && !selectedWalletName && !error) {
        setStatus('No wallet selected.');
      }
      return;
    } catch (err) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('wallet') && msg.toLowerCase().includes('not')) {
        setError('No compatible wallet was found. Please install a supported wallet and try again.');
      } else {
        setError(msg || 'Wallet connection failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
    setStatus('Wallet disconnected.');
    setError('');
    setSelectedWalletName('');
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af' }}>
            {selectedWalletName || 'Wallet'}
          </div>
          <div style={{ marginTop: '0.25rem', fontSize: '1rem', fontWeight: 500, color: '#e5e7eb' }}>
            {publicKey ? 'Wallet connected' : 'Wallet not connected'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {publicKey && (
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', padding: '0.35rem 0.65rem', borderRadius: '999px', backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(148,163,184,0.35)' }}>
              {shortKey(publicKey)}
            </div>
          )}
          {!publicKey ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleConnect}
              style={{
                fontSize: '0.875rem',
                borderRadius: '999px',
                padding: '0.5rem 1.2rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? '#1e293b' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#f9fafb',
                boxShadow: '0 12px 30px rgba(79,70,229,0.45)',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Connecting...' : 'Connect with Freighter'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDisconnect}
              style={{
                fontSize: '0.75rem',
                borderRadius: '999px',
                padding: '0.4rem 1rem',
                border: '1px solid rgba(148,163,184,0.5)',
                background: 'transparent',
                color: '#9ca3af',
                cursor: 'pointer'
              }}
            >
              Disconnect
            </button>
          )}
        </div>
      </div>
      {(status || error) && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
          {status && (
            <div style={{ color: '#a5b4fc' }}>
              {status}
            </div>
          )}
          {error && (
            <div style={{ color: '#f97373' }}>
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
