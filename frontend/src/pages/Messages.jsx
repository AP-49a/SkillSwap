import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import GlassCard from '../components/GlassCard.jsx';
import Loader from '../components/Loader.jsx';
import api from '../utils/api.js';
import { Send, Image, Mic, Smile, Paperclip, CheckCheck } from 'lucide-react';

export const Messages = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const recipientParam = searchParams.get('recipient');

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Fetch recent chats list
  const fetchChats = async () => {
    try {
      const res = await api.get('/messages/chats');
      setChats(res.data);
      
      // If we came from a profile with a ?recipient query parameter
      if (recipientParam) {
        const partner = res.data.find((c) => c.user._id === recipientParam);
        if (partner) {
          setActiveChat(partner.user);
        } else {
          // Fetch user details to start a fresh chat
          try {
            const profilesRes = await api.get('/profiles');
            const targetProfile = profilesRes.data.find((p) => p.user._id === recipientParam);
            if (targetProfile) {
              setActiveChat({
                _id: targetProfile.user._id,
                name: targetProfile.user.name,
                username: targetProfile.user.username,
                avatar: targetProfile.avatar,
              });
            }
          } catch (e) {
            console.error('Failed to prefetch new recipient details', e);
          }
        }
      } else if (res.data.length > 0 && !activeChat) {
        setActiveChat(res.data[0].user);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [recipientParam]);

  // Load active conversation messages
  const fetchConversation = async () => {
    if (!activeChat) return;
    setChatLoading(true);
    try {
      const res = await api.get(`/messages/conversation/${activeChat._id}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    fetchConversation();
    
    // Set up message checking loop for simulation (every 5 seconds)
    let interval;
    if (activeChat) {
      interval = setInterval(fetchConversation, 5000);
    }
    return () => clearInterval(interval);
  }, [activeChat]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      const textToSend = inputText;
      setInputText('');
      
      const res = await api.post('/messages', {
        recipientId: activeChat._id,
        text: textToSend,
      });

      setMessages((prev) => [...prev, res.data]);
      fetchChats(); // Update chats panel with latest message
    } catch (err) {
      showNotification('Messaging Error', err.message, 'error');
    }
  };

  // Mock attachment sharing
  const simulateSendFile = async (fileType) => {
    try {
      const res = await api.post('/messages', {
        recipientId: activeChat._id,
        attachment: {
          name: fileType === 'image' ? 'project_mockup.png' : 'lesson_slides.pdf',
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
          fileType: fileType,
        },
      });
      setMessages((prev) => [...prev, res.data]);
      showNotification('Success', `Shared ${fileType} successfully!`, 'success');
      fetchChats();
    } catch (err) {
      console.error(err);
    }
  };

  // Mock voice note sharing
  const simulateVoiceNote = async () => {
    try {
      const res = await api.post('/messages', {
        recipientId: activeChat._id,
        voiceNoteUrl: 'https://sample-audio-notes.mp3',
      });
      setMessages((prev) => [...prev, res.data]);
      showNotification('Voice Note', 'Audio note shared successfully!', 'success');
      fetchChats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmojiClick = async (msgId, emoji) => {
    try {
      const res = await api.put(`/messages/${msgId}/react`, { emoji });
      setMessages((prev) =>
        prev.map((m) => (m._id === msgId ? { ...m, emojiReaction: res.data.emojiReaction } : m))
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Loader fullPage={true} />;

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      <style>{`
        @media (min-width: 992px) {
          .messages-grid-layout {
            grid-template-columns: 240px 300px 1fr !important;
          }
        }
      `}</style>

      <div className="messages-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', alignItems: 'start' }}>
        <Sidebar />

        {/* Chats Roster column */}
        <GlassCard style={{ padding: '16px 0', height: '75vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0 16px 12px 16px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Inbox Conversations</h3>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', marginTop: '8px' }}>
            {chats.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                No active conversations yet. Find a mentor in Search and click Chat.
              </div>
            ) : (
              chats.map((c) => {
                const isActive = activeChat?._id === c.user._id;
                return (
                  <div
                    key={c.user._id}
                    onClick={() => { setActiveChat(c.user); setSearchParams({ recipient: c.user._id }); }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(17,17,17,0.03)',
                      cursor: 'pointer',
                      backgroundColor: isActive ? 'rgba(212,175,55,0.08)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--secondary)' : '3px solid transparent',
                      transition: 'var(--transition)',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                    }}
                    className="hover-chat-row"
                  >
                    <style>{`
                      .hover-chat-row:hover {
                        background-color: rgba(var(--primary-rgb), 0.03);
                      }
                    `}</style>
                    <img
                      src={c.user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${c.user.username}`}
                      alt="avatar"
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.user.name}</span>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                          {new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                        {c.lastMessage.text || (c.lastMessage.attachment ? 'Shared a file' : 'Sent voice note')}
                      </p>
                    </div>
                    {c.unreadCount > 0 && (
                      <span style={{
                        backgroundColor: 'var(--accent)',
                        color: 'white',
                        fontSize: '9px',
                        fontWeight: 800,
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>

        {/* Chat Conversation space column */}
        <GlassCard style={{ padding: 0, height: '75vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeChat ? (
            <>
              {/* Active Header */}
              <div style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: 'rgba(var(--primary-rgb), 0.01)',
              }}>
                <img
                  src={activeChat.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${activeChat.username}`}
                  alt="avatar"
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600 }}>{activeChat.name}</h4>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>@{activeChat.username}</span>
                </div>
              </div>

              {/* Chat Thread */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {chatLoading && messages.length === 0 ? (
                  <Loader size={24} />
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender._id === user?._id || msg.sender === user?._id;
                    return (
                      <div
                        key={msg._id}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <div style={{
                          backgroundColor: isMe ? 'var(--secondary)' : 'var(--bg-secondary)',
                          color: isMe ? '#111' : 'var(--text-primary)',
                          border: '1px solid var(--glass-border)',
                          padding: '10px 14px',
                          borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                          fontSize: '13px',
                          lineHeight: '1.4',
                          position: 'relative',
                        }}>
                          {msg.text && <div>{msg.text}</div>}
                          
                          {/* Attachments rendering */}
                          {msg.attachment && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                              {msg.attachment.fileType === 'image' ? (
                                <img
                                  src={msg.attachment.url}
                                  alt="attachment"
                                  style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px' }}
                                />
                              ) : (
                                <div style={{ padding: '8px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '6px', fontSize: '11px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <Paperclip size={14} /> <span>{msg.attachment.name}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Voice Note rendering */}
                          {msg.voiceNoteUrl && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '6px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '6px', width: '180px' }}>
                              <button style={{ width: '24px', height: '24px', borderRadius: '50%', border: 'none', backgroundColor: '#111', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', cursor: 'pointer' }}>▶</button>
                              <div style={{ flex: 1, height: '4px', backgroundColor: '#ddd', borderRadius: '2px', position: 'relative' }}>
                                <div style={{ width: '40%', height: '100%', backgroundColor: 'var(--secondary)', borderRadius: '2px' }}></div>
                              </div>
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>0:12</span>
                            </div>
                          )}

                          {/* Reactions overlay */}
                          {msg.emojiReaction && (
                            <div style={{
                              position: 'absolute',
                              bottom: '-10px',
                              right: isMe ? 'auto' : '6px',
                              left: isMe ? '6px' : 'auto',
                              backgroundColor: 'var(--bg-secondary)',
                              border: '1.2px solid var(--glass-border)',
                              borderRadius: '10px',
                              padding: '1px 5px',
                              fontSize: '11px',
                            }}>
                              {msg.emojiReaction}
                            </div>
                          )}
                        </div>

                        {/* Timestamp & Read state panel */}
                        <div style={{
                          display: 'flex',
                          justifyContent: isMe ? 'flex-end' : 'flex-start',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '9px',
                          color: 'var(--text-muted)',
                        }}>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && <CheckCheck size={10} color={msg.isRead ? 'var(--accent)' : 'var(--text-muted)'} />}
                          
                          {/* Mini Reaction buttons */}
                          {!isMe && (
                            <div className="reaction-box" style={{ display: 'flex', gap: '2px', marginLeft: '6px' }}>
                              {['👍', '🔥', '🎓'].map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleEmojiClick(msg._id, emoji)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', padding: 0 }}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: 'rgba(var(--primary-rgb), 0.01)',
              }}>
                <button type="button" onClick={simulateVoiceNote} title="Simulate voice note" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Mic size={18} /></button>
                <button type="button" onClick={() => simulateSendFile('image')} title="Share mockup image" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Image size={18} /></button>
                
                <input
                  type="text"
                  placeholder="Type message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="glass-input"
                  style={{ flex: 1, borderRadius: '20px', height: '38px', fontSize: '13px' }}
                />

                <button type="submit" className="btn btn-secondary btn-sm" style={{ width: '38px', height: '38px', borderRadius: '50%', padding: 0, justifyContent: 'center' }}>
                  <Send size={14} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <Smile size={48} color="var(--glass-border)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginTop: '12px' }}>Start a Swap Conversation</h3>
              <p style={{ fontSize: '12px', textAlign: 'center', maxWidth: '280px', marginTop: '4px' }}>
                Select an active contact thread on the left panel, or explore experts to initiate swap requests.
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default Messages;
