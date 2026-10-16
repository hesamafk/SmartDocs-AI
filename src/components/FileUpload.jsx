import { useRef, useState } from 'react'
import { Upload, FileText, X, Loader2 } from 'lucide-react'

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function FileUpload({ onUpload, uploading, documents, onRemove }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files) {
    const file = files?.[0]
    if (!file || uploading) return
    onUpload(file)
  }

  return (
    <div>
      <div
        role="button" tabIndex={uploading ? -1 : 0} aria-label="Upload a document" aria-disabled={uploading}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!uploading) inputRef.current?.click()
          }
        }}
        className={`dropzone ${dragging ? 'dragging' : ''} ${uploading ? 'busy' : ''}`}
        onDragOver={e => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader2 size={24} className="spinner" style={{ margin: '0 auto 0.5rem' }} />
            <p>Processing & embedding…</p>
            <span>Large files can take a few seconds</span>
          </>
        ) : (
          <>
            <Upload size={24} />
            <p>Drop a file here</p>
            <span>PDF, TXT, MD, CSV, JSON · max ~8 MB</span>
            <div className="browse">Browse files</div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          aria-label="Choose a document"
          tabIndex={-1}
          disabled={uploading}
          accept=".pdf,.txt,.md,.csv,.json,text/plain,application/pdf"
          style={{ display: 'none' }}
          onChange={e => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {documents.length > 0 && (
        <div className="doc-list" style={{ marginTop: '0.85rem' }}>
          {documents.map(doc => (
            <div key={doc.id} className="doc-item">
              <FileText size={15} style={{ color: '#a78bfa', flexShrink: 0 }} />
              <div className="info">
                <div className="name">{doc.name}</div>
                <div className="meta">
                  {formatBytes(doc.size)} · {doc.chunks} chunks
                </div>
              </div>
              <button className="remove" onClick={() => onRemove(doc.name)} disabled={uploading} aria-label={`Remove ${doc.name}`} title="Remove">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
