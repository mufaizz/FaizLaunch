import { useState, useEffect } from 'react'

interface Friend {
  id: string
  name: string
  avatar: string
  status: 'online' | 'offline' | 'gaming'
  currentGame?: string
  addedAt: string
}

interface Profile {
  id: string
  name: string
  avatar: string
  status: 'online' | 'offline' | 'gaming'
  currentGame?: string
}

const STATUS_COLORS = {
  online: '#43d98c',
  offline: '#4a4a6a',
  gaming: '#f5a623',
}

const STATUS_LABELS = {
  online: 'Online',
  offline: 'Offline',
  gaming: 'Gaming',
}

const AVATARS = ['🎮', '🔥', '⚡', '🚀', '💀', '🎯', '🏆', '👾', '🤖', '🦊', '🐉', '🌙']

export default function Together() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [profile, setProfile] = useState<Profile>({
    id: 'me',
    name: 'Mufaiz',
    avatar: '⚡',
    status: 'online',
  })
  const [addingFriend, setAddingFriend] = useState(false)
  const [newFriendName, setNewFriendName] = useState('')
  const [editingProfile, setEditingProfile] = useState(false)
  const [activeTab, setActiveTab] = useState<'friends' | 'activity' | 'saves'>('friends')
  const api = (window as any).faizAPI

  useEffect(() => {
    api.togetherGetProfile?.().then((p: Profile) => { if (p) setProfile(p) })
    api.togetherGetFriends?.().then((f: Friend[]) => { if (f) setFriends(f) })
  }, [])

  const handleAddFriend = async () => {
    if (!newFriendName.trim()) return
    const result = await api.togetherAddFriend?.(newFriendName.trim())
    if (result?.success) {
      setFriends(prev => [...prev, result.friend])
      setNewFriendName('')
      setAddingFriend(false)
    }
  }

  const handleRemoveFriend = async (id: string) => {
    await api.togetherRemoveFriend?.(id)
    setFriends(prev => prev.filter(f => f.id !== id))
  }

  const handleSaveProfile = async () => {
    await api.togetherSaveProfile?.(profile)
    setEditingProfile(false)
  }

  const onlineFriends = friends.filter(f => f.status !== 'offline')
  const offlineFriends = friends.filter(f => f.status === 'offline')

  return (
    <div>
      <div className="page-header">
        <h1>👥 Together</h1>
        <p>Game with friends. Share saves. Never game alone.</p>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'var(--bg4)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem',
            border: `2px solid ${STATUS_COLORS[profile.status]}`,
            cursor: 'pointer',
            flexShrink: 0,
          }}
            onClick={() => setEditingProfile(!editingProfile)}
          >
            {profile.avatar}
          </div>

          <div style={{ flex: 1 }}>
            {editingProfile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {AVATARS.map(a => (
                    <button key={a} onClick={() => setProfile(p => ({ ...p, avatar: a }))}
                      style={{
                        background: profile.avatar === a ? 'var(--accent)' : 'var(--bg3)',
                        border: 'none', borderRadius: '8px', padding: '6px 10px',
                        fontSize: '1.2rem', cursor: 'pointer',
                      }}
                    >{a}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="profileName"
                    name="profileName"
                    type="text"
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    autoComplete="off"
                    style={{
                      flex: 1, padding: '8px 12px', background: 'var(--bg3)',
                      border: '1px solid var(--border)', borderRadius: '8px',
                      color: 'var(--text)', fontSize: '0.9rem', outline: 'none',
                    }}
                  />
                  <select
                    value={profile.status}
                    onChange={e => setProfile(p => ({ ...p, status: e.target.value as any }))}
                    style={{
                      padding: '8px 12px', background: 'var(--bg3)',
                      border: '1px solid var(--border)', borderRadius: '8px',
                      color: 'var(--text)', fontSize: '0.9rem', outline: 'none',
                    }}
                  >
                    <option value="online">Online</option>
                    <option value="gaming">Gaming</option>
                    <option value="offline">Offline</option>
                  </select>
                  <button className="btn-primary" style={{ marginTop: 0, padding: '8px 16px' }} onClick={handleSaveProfile}>
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{profile.name}</span>
                  <span style={{
                    padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                    background: `${STATUS_COLORS[profile.status]}20`,
                    color: STATUS_COLORS[profile.status],
                  }}>
                    {STATUS_LABELS[profile.status]}
                  </span>
                </div>
                {profile.currentGame && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text2)', marginTop: '4px' }}>
                    🎮 Playing {profile.currentGame}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: '4px' }}>
                  Click avatar to edit profile
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', fontSize: '0.82rem', color: 'var(--text2)' }}>
            <div style={{ textAlign: 'center', padding: '8px 16px', background: 'var(--bg3)', borderRadius: '8px' }}>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.4rem', color: 'var(--accent)', fontWeight: 700 }}>
                {friends.length}
              </div>
              <div>Friends</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 16px', background: 'var(--bg3)', borderRadius: '8px' }}>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.4rem', color: 'var(--green)', fontWeight: 700 }}>
                {onlineFriends.length}
              </div>
              <div>Online</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        {(['friends', 'activity', 'saves'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px',
              background: activeTab === tab ? 'rgba(245,166,35,0.12)' : 'var(--bg2)',
              border: `1px solid ${activeTab === tab ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '8px',
              color: activeTab === tab ? 'var(--accent)' : 'var(--text2)',
              cursor: 'pointer',
              fontSize: '0.88rem',
              fontWeight: 500,
              textTransform: 'capitalize',
              transition: 'all 0.15s',
            }}
          >
            {tab === 'friends' ? '👥' : tab === 'activity' ? '🔥' : '💾'} {tab}
          </button>
        ))}
      </div>

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div>
          {/* Add Friend */}
          <div style={{ marginBottom: '20px' }}>
            {addingFriend ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  id="friendName"
                  name="friendName"
                  type="text"
                  value={newFriendName}
                  onChange={e => setNewFriendName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
                  placeholder="Enter friend's username..."
                  autoComplete="off"
                  autoFocus
                  style={{
                    flex: 1, padding: '10px 14px', background: 'var(--bg2)',
                    border: '1px solid var(--accent)', borderRadius: '8px',
                    color: 'var(--text)', fontSize: '0.9rem', outline: 'none',
                  }}
                />
                <button className="install-btn" style={{ width: 'auto', padding: '10px 20px', marginTop: 0 }} onClick={handleAddFriend}>
                  Add
                </button>
                <button className="btn-secondary" onClick={() => { setAddingFriend(false); setNewFriendName('') }}>
                  Cancel
                </button>
              </div>
            ) : (
              <button className="btn-secondary" onClick={() => setAddingFriend(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                + Add Friend
              </button>
            )}
          </div>

          {/* Online Friends */}
          {onlineFriends.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div className="sidebar-label" style={{ marginBottom: '10px' }}>
                Online — {onlineFriends.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {onlineFriends.map(friend => (
                  <FriendCard key={friend.id} friend={friend} onRemove={handleRemoveFriend} />
                ))}
              </div>
            </div>
          )}

          {/* Offline Friends */}
          {offlineFriends.length > 0 && (
            <div>
              <div className="sidebar-label" style={{ marginBottom: '10px' }}>
                Offline — {offlineFriends.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {offlineFriends.map(friend => (
                  <FriendCard key={friend.id} friend={friend} onRemove={handleRemoveFriend} />
                ))}
              </div>
            </div>
          )}

          {friends.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👥</div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.3rem', color: 'var(--text2)' }}>
                No friends yet
              </div>
              <div style={{ color: 'var(--text3)', fontSize: '0.9rem', marginTop: '8px' }}>
                Add friends to see what they're playing
              </div>
              <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => setAddingFriend(true)}>
                + Add First Friend
              </button>
            </div>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {friends.filter(f => f.status === 'gaming').length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔥</div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.3rem', color: 'var(--text2)' }}>
                No activity right now
              </div>
              <div style={{ color: 'var(--text3)', fontSize: '0.9rem', marginTop: '8px' }}>
                When your friends are gaming, you'll see it here
              </div>
            </div>
          ) : (
            friends.filter(f => f.status === 'gaming').map(friend => (
              <div key={friend.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
                <div style={{
                  width: '48px', height: '48px', background: 'var(--bg4)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '1.5rem',
                  border: `2px solid ${STATUS_COLORS.gaming}`,
                }}>
                  {friend.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{friend.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent)', marginTop: '2px' }}>
                    🎮 Playing {friend.currentGame}
                  </div>
                </div>
                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '7px 14px' }}>
                  👁 Watch
                </button>
                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '7px 14px' }}>
                  🎮 Join
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Saves Tab */}
      {activeTab === 'saves' && (
        <div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-title">Share Save Files</div>
            <div style={{ color: 'var(--text2)', fontSize: '0.9rem', lineHeight: 1.7 }}>
              Send your game save files to friends or receive theirs.
              Great for helping a friend skip to where you are, or continuing on a different PC.
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💾</div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.3rem', color: 'var(--text2)' }}>
              No save files shared yet
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '0.9rem', marginTop: '8px' }}>
              Add friends first, then you can share save files with them
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FriendCard({ friend, onRemove }: { friend: Friend, onRemove: (id: string) => void }) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      className="card"
      style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s' }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: '44px', height: '44px', background: 'var(--bg4)',
          borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.4rem',
        }}>
          {friend.avatar}
        </div>
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: '12px', height: '12px', borderRadius: '50%',
          background: STATUS_COLORS[friend.status],
          border: '2px solid var(--bg2)',
        }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{friend.name}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: '2px' }}>
          {friend.status === 'gaming' && friend.currentGame
            ? `🎮 Playing ${friend.currentGame}`
            : STATUS_LABELS[friend.status]
          }
        </div>
      </div>

      {showActions && (
        <div style={{ display: 'flex', gap: '6px' }}>
          {friend.status === 'gaming' && (
            <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '5px 10px' }}>
              Join
            </button>
          )}
          <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '5px 10px' }}>
            💾 Share Save
          </button>
          <button
            className="btn-danger"
            style={{ fontSize: '0.75rem', padding: '5px 10px' }}
            onClick={e => { e.stopPropagation(); onRemove(friend.id) }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}