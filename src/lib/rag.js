// Simple client-side RAG helpers

export function chunkText(text, chunkSize = 700, overlap = 120) {
  if (!Number.isInteger(chunkSize) || chunkSize < 1 || !Number.isInteger(overlap) || overlap < 0 || overlap >= chunkSize) {
    throw new RangeError('Require chunkSize > 0 and 0 <= overlap < chunkSize')
  }
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\t/g, ' ').trim()
  if (!cleaned) return []
  if (cleaned.length <= chunkSize) return [cleaned]

  const chunks = []
  let start = 0

  while (start < cleaned.length) {
    let end = Math.min(start + chunkSize, cleaned.length)

    if (end < cleaned.length) {
      const slice = cleaned.slice(start, end)
      const breakAt = Math.max(
        slice.lastIndexOf('. '),
        slice.lastIndexOf('.\n'),
        slice.lastIndexOf('\n\n'),
      )
      if (breakAt > chunkSize * 0.35) {
        end = start + breakAt + 1
      }
    }

    const piece = cleaned.slice(start, end).trim()
    if (piece.length > 20) chunks.push(piece)
    start = Math.max(start + 1, end - overlap)
    if (start < 0) start = 0
    if (end >= cleaned.length) break
  }

  return chunks
}

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

export function rankChunks(queryEmbedding, chunks, topK = 4) {
  const scored = chunks.map(c => ({
    chunk: c,
    score: cosineSimilarity(queryEmbedding, c.embedding),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, topK).map(s => s.chunk)
}
