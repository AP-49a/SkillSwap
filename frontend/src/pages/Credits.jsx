import React, { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Coins, RefreshCw } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import Loader from '../components/Loader.jsx';
import api from '../utils/api.js';

export const Credits = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWallet = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/wallet');
      setWallet(response.data);
    } catch (err) {
      setError(err.message || 'We couldn’t load your wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWallet(); }, []);

  if (loading) return <Loader fullPage />;

  return (
    <div className="app-page-layout">
      <Sidebar />
      <section className="app-page-main">
        <header className="page-heading">
          <div><span className="page-eyebrow">YOUR ACCOUNT</span><h1>Credits &amp; transactions</h1><p>See your available balance and the credits you’ve earned or spent.</p></div>
          <button type="button" className="btn btn-outline" onClick={loadWallet}><RefreshCw size={15} /> Refresh</button>
        </header>

        {error ? (
          <div className="page-error" role="alert"><p>{error}</p><button className="btn btn-outline" onClick={loadWallet}>Try again</button></div>
        ) : (
          <>
            <section className="wallet-summary">
              <span className="wallet-icon"><Coins size={19} /></span>
              <div><span>Available balance</span><strong>{Number(wallet?.balance || 0).toLocaleString()} <small>credits</small></strong><p>Use credits to book peer learning sessions and courses.</p></div>
            </section>

            <section className="wallet-history" aria-labelledby="wallet-history-title">
              <div className="wallet-history-heading"><div><h2 id="wallet-history-title">Transaction history</h2><p>Recent changes to your credit balance.</p></div><span>{wallet?.transactions?.length || 0} transactions</span></div>
              {wallet?.transactions?.length ? (
                <div className="wallet-transaction-list">
                  {wallet.transactions.map((transaction, index) => {
                    const isCredit = transaction.type === 'credit';
                    return (
                      <article className="wallet-transaction" key={transaction._id || `${transaction.date}-${index}`}>
                        <span className={`transaction-type-icon ${isCredit ? 'is-credit' : 'is-debit'}`}>{isCredit ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}</span>
                        <div className="transaction-description"><strong>{transaction.description}</strong><span>{new Date(transaction.date || transaction.createdAt).toLocaleString()}</span></div>
                        <div className={`transaction-amount ${isCredit ? 'is-credit' : 'is-debit'}`}>{isCredit ? '+' : '−'}{Number(transaction.amount || 0).toLocaleString()} <small>CR</small></div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="wallet-empty"><Coins size={22} /><p>No transactions yet. Completed teaching sessions and course bookings will show up here.</p></div>
              )}
            </section>
          </>
        )}
      </section>
    </div>
  );
};

export default Credits;
