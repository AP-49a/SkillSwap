import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import GlassCard from '../components/GlassCard.jsx';
import Loader from '../components/Loader.jsx';
import api from '../utils/api.js';
import { useNotification } from '../context/NotificationContext.jsx';
import { Users, Calendar, ShieldCheck, Coins, Database, Check } from 'lucide-react';

export const AdminPanel = () => {
  const { showNotification } = useNotification();
  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Credit adjust state
  const [selectedUser, setSelectedUser] = useState('');
  const [adjustAmount, setAdjustAmount] = useState(0);

  const fetchAdminData = async () => {
    try {
      const analyticRes = await api.get('/admin/analytics');
      setAnalytics(analyticRes.data);

      const usersRes = await api.get('/admin/users');
      setUsersList(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerifyToggle = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/verify`);
      showNotification('Success', res.message, 'success');
      fetchAdminData();
    } catch (err) {
      showNotification('Error', err.message, 'error');
    }
  };

  const handleCreditAdjust = async (e) => {
    e.preventDefault();
    if (!selectedUser || !adjustAmount) return;

    try {
      const res = await api.put(`/admin/users/${selectedUser}/credits`, { amount: Number(adjustAmount) });
      showNotification('Wallet Adjusted', res.message, 'success');
      setAdjustAmount(0);
      setSelectedUser('');
      fetchAdminData();
    } catch (err) {
      showNotification('Error', err.message, 'error');
    }
  };

  if (loading) return <Loader fullPage={true} />;

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      <style>{`
        @media (min-width: 992px) {
          .admin-grid-layout {
            grid-template-columns: 240px 1fr !important;
          }
        }
      `}</style>

      <div className="admin-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', alignItems: 'start' }}>
        <Sidebar />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700 }}>Admin Analytics Engine</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Control panel for platform verification badges, user metrics, and currency configurations.
            </p>
          </div>

          {/* Stats Boxes */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '20px',
          }}>
            {[
              { label: 'Total Accounts', value: analytics?.totalUsers, icon: <Users size={20} color="var(--secondary)" /> },
              { label: 'Total Sessions', value: analytics?.totalSessions, icon: <Calendar size={20} color="var(--accent)" /> },
              { label: 'Completed Classes', value: analytics?.completedSessions, icon: <Check size={20} color="#3b82f6" /> },
              { label: 'Platform Credit Pool', value: `${analytics?.totalCirculatingCredits} CR`, icon: <Coins size={20} color="var(--secondary)" /> },
            ].map((box, i) => (
              <GlassCard key={i} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '16px' }} className="hover-lift">
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--glass-border)',
                }}>
                  {box.icon}
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{box.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '2px' }}>{box.value}</div>
                </div>
              </GlassCard>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
            <style>{`
              @media (min-width: 992px) {
                .admin-bottom-split {
                  grid-template-columns: 2fr 1fr !important;
                }
              }
            `}</style>
            
            <div className="admin-bottom-split" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
              {/* Users Ledger Table */}
              <GlassCard style={{ padding: '20px', overflowX: 'auto' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>System Users Statement</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', minWidth: '500px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1.5px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px 0' }}>User</th>
                      <th>Email</th>
                      <th>Credits</th>
                      <th>Level</th>
                      <th>Verified Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u._id} style={{ borderBottom: '1px solid rgba(17,17,17,0.03)' }}>
                        <td style={{ padding: '12px 0', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <img
                            src={u.profile?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.username}`}
                            alt="avatar"
                            style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                          />
                          <div>
                            <span style={{ fontWeight: 600 }}>{u.name}</span>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>@{u.username}</div>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td style={{ fontWeight: 700, color: 'var(--secondary)' }}>{u.credits} CR</td>
                        <td>{u.level}</td>
                        <td>
                          <span className={`badge ${u.isVerified ? 'badge-accent' : 'badge-muted'}`} style={{ fontSize: '9px' }}>
                            {u.isVerified ? 'VERIFIED' : 'PENDING'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleVerifyToggle(u._id)}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '10px', padding: '4px 8px' }}
                          >
                            Toggle Verification
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>

              {/* Adjust Credits configuration panel */}
              <GlassCard style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Database size={16} color="var(--secondary)" /> Adjust Credits
                </h3>
                <form onSubmit={handleCreditAdjust} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>
                      Select User
                    </label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="glass-input"
                      style={{ fontSize: '12px', height: '36px', padding: '0 8px' }}
                      required
                    >
                      <option value="">Choose User...</option>
                      {usersList.map((u) => (
                        <option key={u._id} value={u._id}>@{u.username} ({u.name})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>
                      Amount (positive/negative)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 50 or -30"
                      value={adjustAmount === 0 ? '' : adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      className="glass-input"
                      style={{ fontSize: '12px', height: '36px' }}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-secondary btn-sm" style={{ width: '100%', padding: '10px 0', marginTop: '6px' }}>
                    Apply Currency Changes
                  </button>
                </form>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
