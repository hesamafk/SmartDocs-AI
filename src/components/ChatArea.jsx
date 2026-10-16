import { useEffect, useRef } from 'react'
import { Send, Sparkles, User, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ChatArea({
  messages,
  input,
  setInput,
  onSubmit,
  loading,
  hasDocs,
}) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <section className="chat-area">
      <div className="messages">
        {messages.length === 0 && (
          <div className="msg-empty">
            <div className="box">
              <Sparkles size={20} style={{ color: '#a78bfa' }} />
            </div>
            <p>
              {hasDocs
                ? 'Ask anything about your documents'
                : 'Upload a document to get started'}
            </p>
            <span>
              {hasDocs
                ? 'Answers come only from the files you uploaded.'
                : 'PDF and text files are supported.'}
            </span>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            <div className={`avatar ${m.role}`}>
              {m.role === 'user' ? <User size={13} /> : <Bot size={13} />}
            </div>
            <div className="msg-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {m.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {loading && (
          <div className="loading-row">
            <div className="spinner" />
            Searching documents…
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form className="input-row" onSubmit={onSubmit}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={
            hasDocs
              ? 'Ask a question about your documents…'
              : 'Upload a document first'
          }
          disabled={!hasDocs || loading}
        />
        <button
          type="submit"
          className="btn btn-primary btn-icon"
          disabled={!hasDocs || loading || !input.trim()}
        >
          <Send size={15} />
        </button>
      </form>
    </section>
  )
}
