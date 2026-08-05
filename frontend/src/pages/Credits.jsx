import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import GlassCard from '../components/GlassCard.jsx';
import Loader from '../components/Loader.jsx';
import api from '../utils/api.js';
import { Coins, Plus, Copy, Share2, Sparkles, TrendingUp, CheckCircle } from 'lucide-react';

export const Credits = () => {
  const { user, refreshUser } = useAuth();
  const { showNotification } = useNotification();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailyClaimed, setDailyClaimed] = useState(false);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await api.get('/notifications');
        // Filter out notifications relating to credits
        const ledger = res.data.filter((n) => n.type === 'credits_spent' || n.type === 'credits_earned' || n.type === 'achievement_unlocked' && n.metaData?.creditsAmount);
        setTransactions(ledger);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchLedger();
    }
  }, [user]);

  const copyReferralCode = () => {
    navigator.clipboard.writeText(user?.referralCode || '');
    showNotification('Code Copied', 'Your referral code was copied to your clipboard!', 'success');
  };

  const claimDailyBonus = async () => {
    if (dailyClaimed) return;
    try {
      // Simulate claiming daily login
      showNotification('Daily Bonus Claimed!', 'You earned +10 Skill Credits & +20 XP!', 'success');
      setDailyClaimed(true);
      
      // Hit endpoint to credit user (simulated via standard PUT in admin or auth profiles)
      // For simplicity, we can reload user status
      setTimeout(refreshUser, 500);
    } catch (error) {
      console.error(error);
    }
  };

  // Mock revenue models action triggers
  const purchaseFeatureProfile = () => {
    if (user.credits < 50) {
      showNotification('Insufficient Credits', 'You need at least 50 credits to feature your profile.', 'error');
      return;
    }
    showNotification('Profile Featured!', 'Your profile will be pinned in search recommendations for 7 days.', 'success');
  };

  if (loading) return <Loader fullPage={true} />;

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      <style>{`
        @media (min-width: 992px) {
          .credits-grid-layout {
            grid-template-columns: 240px 1fr 320px !important;
          }
        }
      `}</style>

      <div className="credits-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', alignItems: 'start' }}>
        <Sidebar />

        {/* Center: Wallet and Transactions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700 }}>Skill Wallet</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Your credit statement and history. Earn credits by teaching and spend them to learn.
            </p>
          </div>

          {/* Large Credit Card Display */}
          <div className="gold-gradient-bg" style={{
            padding: '32px',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid rgba(212, 175, 55, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>
                Available Exchange Balance
              </div>
              <div style={{ fontSize: '48px', fontWeight: 800, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={36} fill="var(--secondary)" color="var(--secondary)" />
                {user?.credits} <span style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-muted)' }}>Credits</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                1 Hour Class = 20 Credits (Fixed Rate)
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1 }}>
              <button onClick={claimDailyBonus} disabled={dailyClaimed} className={`btn ${dailyClaimed ? 'btn-outline' : 'btn-secondary'} btn-sm`}>
                {dailyClaimed ? 'Daily claimed' : 'Claim Daily Bonus (+10 CR)'}
              </button>
            </div>
          </div>

          {/* Transactions Ledger */}
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>Transaction History statement</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {transactions.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No transactions recorded yet. Complete session bookings to populate the statement.
                </div>
              ) : (
                transactions.map((t) => {
                  const isEarned = t.type === 'credits_earned' || t.type === 'achievement_unlocked';
                  return (
                    <GlassCard key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{t.title}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>{t.message}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {new Date(t.createdAt).toLocaleDateString()} at {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: isEarned ? 'var(--accent)' : 'var(--danger)' }}>
                        {isEarned ? `+${t.metaData?.creditsAmount || 0}` : `-${t.metaData?.creditsAmount || 0}`} CR
                      </span>
                    </GlassCard>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Referrals and Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Referral card */}
          <GlassCard style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Share2 size={16} color="var(--secondary)" /> Share & Earn
            </h4>
            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '14px' }}>
              Invite colleagues. Both receive <strong>+50 credits</strong> when they register and complete their setup.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                readOnly
                value={user?.referralCode || ''}
                className="glass-input"
                style={{ fontSize: '12px', height: '36px', textAlign: 'center', fontWeight: 700, letterSpacing: '0.5px' }}
              />
              <button onClick={copyReferralCode} className="btn btn-outline" style={{ padding: '0 10px', height: '36px' }}>
                <Copy size={14} />
              </button>
            </div>
          </GlassCard>

          {/* Premium features checklist (Revenue Mode) */}
          <GlassCard style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="var(--secondary)" /> Premium Boosts
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700 }}>Featured Profile Boost</div>
                <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                  Pin your profile at the top of recommended mentors grids. Costs 50 CR/week.
                </p>
                <button onClick={purchaseFeatureProfile} className="btn btn-secondary btn-sm" style={{ width: '100%', fontSize: '10px', padding: '4px 0', marginTop: '8px' }}>
                  Boost Profile
                </button>
              </div>

              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700 }}>Skill Certification</div>
                <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                  Request an expert verification review on your offered skill. Costs 30 CR.
                </p>
                <button onClick={() => showNotification('Request Sent', 'Certification review queued.', 'success')} className="btn btn-outline btn-sm" style={{ width: '100%', fontSize: '10px', padding: '4px 0', marginTop: '8px' }}>
                  Certify Skill
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Credits;
