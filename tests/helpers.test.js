import test from 'node:test'
import assert from 'node:assert/strict'
import { chunkText, cosineSimilarity, rankChunks } from '../src/lib/rag.js'
import { readSseData } from '../src/lib/stream.js'

test('chunking validates input and always advances with large overlap', () => {
  assert.throws(() => chunkText('abc', 10, 10), RangeError)
  assert.throws(() => chunkText('abc', 0, 0), RangeError)
  assert.deepEqual(chunkText('   '), [])
  const text = ('A sentence. More text. ').repeat(50)
  const pieces = chunkText(text, 100, 90)
  assert.ok(pieces.length > 1 && pieces.length <= text.length)
  assert.ok(pieces.every(piece => piece.length <= 100))
})

test('similarity and ranking select the relevant passage', () => {
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0)
  assert.equal(cosineSimilarity([0, 0], [1, 1]), 0)
  const chunks = [{ text: 'wrong', embedding: [0, 1] }, { text: 'right', embedding: [1, 0] }]
  assert.equal(rankChunks([1, 0], chunks, 1)[0].text, 'right')
})

test('stream parser preserves split JSON and multibyte UTF-8', async () => {
  const lines = ['{"choices":[{"delta":{"content":"سلام"}}]}', '[DONE]']
  const bytes = new TextEncoder().encode('data: ' + lines[0] + '\r\n\r\ndata: [DONE]\n\n')
  const body = new ReadableStream({
    start(controller) {
      for (const byte of bytes) controller.enqueue(new Uint8Array([byte]))
      controller.close()
    }
  })
  const result = []
  for await (const line of readSseData(body)) result.push(line)
  assert.deepEqual(result, lines)
})

test('stream parser emits an unterminated final record', async () => {
  const body = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('data: final')); c.close() } })
  const result = []
  for await (const line of readSseData(body)) result.push(line)
  assert.deepEqual(result, ['final'])
})
