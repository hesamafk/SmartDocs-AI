// Preserve partial SSE records across arbitrary network chunk boundaries.
export async function* readSseData(body) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let pending = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      pending += done ? decoder.decode() : decoder.decode(value, { stream: true })
      const lines = pending.split('\n')
      pending = lines.pop()
      if (done && pending) { lines.push(pending); pending = '' }
      for (const line of lines) {
        if (line.startsWith('data:')) yield line.slice(5).trim()
      }
      if (done) break
    }
  } finally {
    try { await reader.cancel() } finally { reader.releaseLock() }
  }
}
