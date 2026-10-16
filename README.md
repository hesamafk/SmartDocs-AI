# SmartDocs-AI

React/Vite AI document interface prototype; review data handling before production.

**Status:** Experimental / portfolio project. Not production-ready.

## Getting started
Run `npm ci`, then `npm run dev`. Build with `npm run build`.

## Notes
Do not use demo authentication, sample data, payment or admin UI as a production service without a security review.

## Original notes
# SmartDocs AI

Chat with your own PDFs and text files.

I built this because I kept downloading long docs just to search for one paragraph.  
Upload a file → it gets chunked and embedded → you ask questions and only the relevant parts go to the model.

## Features

- Drag & drop PDF / TXT / MD / CSV / JSON
- Client-side PDF text extraction (pdf.js)
- Chunking + OpenAI embeddings (`text-embedding-3-small`)
- Cosine similarity retrieval
- Streaming answers with gpt-4o-mini
- Everything stays in the browser (no backend)

## Stack

- React 18 + Vite
- plain CSS
- pdfjs-dist
- OpenAI API (embeddings + chat)

## Run

```bash
npm install
npm run dev
```

Open the local URL (usually http://localhost:5173).

Paste your OpenAI API key in the banner. It is stored only in localStorage.

## Structure

```
index.html
src/
  main.jsx
  App.jsx
  components/
    FileUpload.jsx
    ChatArea.jsx
  lib/
    rag.js        # chunking + cosine similarity
    pdf.js        # PDF text extraction
  styles/
    index.css
    App.css
```

## Notes

- Embeddings and chat run directly from the browser. Fine for a personal/demo project.
- Large PDFs create many embedding requests – the code batches them.
- Data lives in React state, so a refresh clears everything.

## Build

```bash
npm run build
```

## License

MIT
