import { useState, useEffect, useRef } from 'react'
import { FileText, Trash2 } from 'lucide-react'
import FileUpload from './components/FileUpload'
import ChatArea from './components/ChatArea'
import { chunkText, rankChunks } from './lib/rag'
import { extractText } from './lib/pdf'
import { v4 as uuid } from 'uuid'
import './styles/App.css'

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_key') || '')
  const [documents, setDocuments] = useState([])
  const [chunks, setChunks] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState(null)
  const abortRef = useRef(null)

  useEffect(() => {
    if (apiKey) localStorage.setItem('openai_key', apiKey)
  }, [apiKey])

  async function embedTexts(texts) {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: texts,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || `Embedding failed (${res.status})`)
    }

    const data = await res.json()
    return data.data.map(d => d.embedding)
  }

  async function handleUpload(file) {
    if (!apiKey.trim()) {
      setStatus({ type: 'err', text: 'Add your OpenAI API key first.' })
      return
    }

    setUploading(true)
    setStatus(null)

    try {
      const raw = await extractText(file)
      if (!raw || raw.trim().length < 40) {
        throw new Error('Could not extract enough text from this file.')
      }

      const textChunks = chunkText(raw)
      if (textChunks.length === 0) throw new Error('No usable content after chunking.')

      // embed in small batches
      const embeddings = []
      const batchSize = 16
      for (let i = 0; i < textChunks.length; i += batchSize) {
        const batch = textChunks.slice(i, i + batchSize)
        const embs = await embedTexts(batch)
        embeddings.push(...embs)
      }

      const docId = uuid()
      const newChunks = textChunks.map((text, idx) => ({
        id: `${docId}-${idx}`,
        text,
        embedding: embeddings[idx],
        source: file.name,
      }))

      const meta = {
        id: docId,
        name: file.name,
        size: file.size,
        chunks: newChunks.length,
      }

      // replace if same name
      setDocuments(prev => [...prev.filter(d => d.name !== file.name), meta])
      setChunks(prev => [...prev.filter(c => c.source !== file.name), ...newChunks])
      setStatus({ type: 'ok', text: `Loaded ${newChunks.length} chunks from "${file.name}"` })
    } catch (err) {
      setStatus({ type: 'err', text: err.message })
    } finally {
      setUploading(false)
    }
  }

  function removeDoc(name) {
    setDocuments(prev => prev.filter(d => d.name !== name))
    setChunks(prev => prev.filter(c => c.source !== name))
  }

  function clearAll() {
    setDocuments([])
    setChunks([])
    setMessages([])
    setStatus(null)
  }

  async function handleChat(e) {
    e.preventDefault()
    if (!input.trim() || loading) return
    if (chunks.length === 0) {
      setStatus({ type: 'err', text: 'Upload a document first.' })
      return
    }

    const question = input.trim()
    setInput('')
    setLoading(true)

    const userMsg = { role: 'user', content: question }
    setMessages(prev => [...prev, userMsg])

    try {
      // embed question
      const [queryEmb] = await embedTexts([question])
      const relevant = rankChunks(queryEmb, chunks, 5)

      const context = relevant
        .map((c, i) => `[${c.source} – part ${i + 1}]\n${c.text}`)
        .join('\n\n---\n\n')

      const system = `You answer questions using only the document context below.
If the answer is not in the context, say so. Cite the file name when possible.
Keep answers clear and use markdown when helpful.

Context:
${context}`

      abortRef.current = new AbortController()

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          stream: true,
          temperature: 0.2,
          messages: [
            { role: 'system', content: system },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: question },
          ],
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error?.message || `API error ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let answer = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              answer += delta
              setMessages(prev => {
                const copy = [...prev]
                copy[copy.length - 1] = { role: 'assistant', content: answer }
                return copy
              })
            }
          } catch {
            // skip bad chunks
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `⚠️ ${err.message}` },
        ])
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <div className="logo">
            <FileText />
          </div>
          <div>
            <h1>SmartDocs AI</h1>
            <div className="sub">Chat with your documents</div>
          </div>
        </div>
        {documents.length > 0 && (
          <button className="btn btn-ghost" onClick={clearAll}>
            <Trash2 size={13} />
            Clear all
          </button>
        )}
      </header>

      {!apiKey && (
        <div className="key-banner">
          <p>OpenAI API key (stays in your browser only):</p>
          <input
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
        </div>
      )}

      {apiKey && (
        <div style={{ padding: '0.4rem 1.25rem 0', textAlign: 'right' }}>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setApiKey('')
              localStorage.removeItem('openai_key')
            }}
          >
            Change API key
          </button>
        </div>
      )}

      <div className="layout">
        <aside className="sidebar">
          <div>
            <h2>Documents</h2>
            <FileUpload
              onUpload={handleUpload}
              uploading={uploading}
              documents={documents}
              onRemove={removeDoc}
            />
            {status && (
              <div className={`status ${status.type}`} style={{ marginTop: '0.6rem' }}>
                {status.text}
              </div>
            )}
          </div>
          <div className="tips">
            <strong>How it works</strong>
            <ol>
              <li>Upload a PDF or text file</li>
              <li>We split it and create embeddings</li>
              <li>Your question only uses the most relevant parts</li>
            </ol>
          </div>
        </aside>

        <ChatArea
          messages={messages}
          input={input}
          setInput={setInput}
          onSubmit={handleChat}
          loading={loading}
          hasDocs={documents.length > 0}
        />
      </div>

      <footer className="footer">
        SmartDocs AI · React + Vite · embeddings + gpt-4o-mini
      </footer>
    </div>
  )
}
