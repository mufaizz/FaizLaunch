import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: string
}

const QUICK_QUESTIONS = [
  'My install is stuck at 0%',
  'ISDone.dll error help',
  'Windows Defender deleted files',
  'Game crashes after install',
  'Not enough disk space',
  'How to speed up HDD install',
]

export default function AICompanion() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'ai',
      content: `Hey! I'm FaizAI — your gaming companion built into FaizLaunch. 🎮

I know about every common installation error, DLL problem, and Windows issue that gamers face.

Tell me what's wrong and I'll fix it. You can also paste your error message directly.`,
      timestamp: new Date().toISOString(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const api = (window as any).faizAPI

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    setInput('')
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const hardware = await api.getHardwareInfo()
      const result = await api.aiChat(msg, hardware)

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: result.response,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMsg])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'Something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      }])
    }

    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      <div className="page-header">
        <h1>🤖 AI Companion</h1>
        <p>FaizAI — knows every gaming error. Ask anything.</p>
      </div>

      {/* Quick questions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {QUICK_QUESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => sendMessage(q)}
            style={{
              padding: '6px 14px',
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              color: 'var(--text2)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.borderColor = 'var(--accent)'
              ;(e.target as HTMLElement).style.color = 'var(--accent)'
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.borderColor = 'var(--border)'
              ;(e.target as HTMLElement).style.color = 'var(--text2)'
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '75%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, var(--accent), var(--accent2))'
                : 'var(--bg3)',
              border: msg.role === 'ai' ? '1px solid var(--border)' : 'none',
              color: msg.role === 'user' ? '#000' : 'var(--text)',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              fontWeight: msg.role === 'user' ? '500' : '400',
            }}>
              {msg.role === 'ai' && (
                <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginBottom: '6px', fontWeight: 600, letterSpacing: '1px' }}>
                  ⚡ FAIZAI
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 16px',
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: '12px 12px 12px 4px',
              color: 'var(--text2)',
              fontSize: '0.9rem',
            }}>
              <span style={{ animation: 'pulse 1s infinite' }}>🤖 FaizAI is thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          id="aiInput"
          name="aiInput"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Describe your problem or paste your error message..."
          autoComplete="off"
          style={{
            flex: 1,
            padding: '13px 16px',
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            color: 'var(--text)',
            fontSize: '0.9rem',
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          style={{
            padding: '13px 24px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            border: 'none',
            borderRadius: '10px',
            color: '#000',
            fontWeight: '700',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '1rem',
            letterSpacing: '1px',
            cursor: 'pointer',
            opacity: loading || !input.trim() ? 0.4 : 1,
          }}
        >
          SEND
        </button>
      </div>
    </div>
  )
}