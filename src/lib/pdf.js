// Extract text from PDF using pdfjs-dist

import * as pdfjsLib from 'pdfjs-dist'

// worker from CDN so we don't have to mess with vite config too much
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

export async function extractTextFromPdf(file) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const strings = content.items.map(item => item.str)
    pages.push(strings.join(' '))
  }

  return pages.join('\n\n')
}

export async function extractText(file) {
  const name = file.name.toLowerCase()

  if (name.endsWith('.pdf')) {
    return extractTextFromPdf(file)
  }

  // plain text / markdown / csv / json
  return file.text()
}
