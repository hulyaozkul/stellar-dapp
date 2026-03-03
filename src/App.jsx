import { useCallback, useState } from 'react';
import WalletConnect from './components/WalletConnect.jsx';
import Balance from './components/Balance.jsx';
import SendTransaction from './components/SendTransaction.jsx';
import ContractCall from './components/ContractCall.jsx';

const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2rem 1rem',
  background:
    'radial-gradient(circle at top, rgba(56,189,248,0.18), transparent 55%), radial-gradient(circle at bottom, rgba(129,140,248,0.25), transparent 55%), #020617',
  color: '#e5e7eb'
};

const shellStyle = {
  width: '100%',
  maxWidth: '840px',
  borderRadius: '1.5rem',
  border: '1px solid rgba(148,163,184,0.4)',
  background:
    'linear-gradient(145deg, rgba(15,23,42,0.98), rgba(15,23,42,0.9))',
  boxShadow: '0 30px 80px rgba(15,23,42,0.95)',
  padding: '1.75rem'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '1.5rem',
  alignItems: 'center',
  marginBottom: '1.5rem'
};

export default function App() {
  const [publicKey, setPublicKey] = useState('');
  const [balance, setBalance] = useState(null);

  const handleConnect = useCallback(key => {
    setPublicKey(key);
  }, []);

  const handleDisconnect = useCallback(() => {
    setPublicKey('');
    setBalance(null);
  }, []);

  const handleBalanceChange = useCallback(value => {
    setBalance(typeof value === 'number' ? value : null);
  }, []);

  return (
    <div style={pageStyle}>
      <div style={shellStyle}>
        <div style={headerStyle}>
          <div>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#64748b' }}>
              Stellar Testnet
            </div>
            <div style={{ marginTop: '0.25rem', fontSize: '1.45rem', fontWeight: 600, color: '#e5e7eb' }}>
              XLM Wallet &amp; Payments
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
            <div>Ağ: Testnet</div>
            <div>Horizon: horizon-testnet.stellar.org</div>
          </div>
        </div>
        <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.1fr)', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <WalletConnect
              publicKey={publicKey}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
            <Balance
              publicKey={publicKey}
              onBalanceChange={handleBalanceChange}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <SendTransaction publicKey={publicKey} balance={balance} />
            <ContractCall publicKey={publicKey} />
          </div>
        </div>
      </div>
    </div>
  );
}
