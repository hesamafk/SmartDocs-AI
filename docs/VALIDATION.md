# Validation record

Reviewed on 2026-10-16.

- Local HTML/CSS asset references and standalone/inline JavaScript syntax: passed.
- Original source snapshot: [source history](https://github.com/hesamafk/SmartDocs-AI/commit/4982e52d6f03b47f0487ea8e292b0985b5e42cca).
- Rendered desktop (1280 px) and mobile (390 px) checks: completed. JavaScript errors and horizontal overflow were checked; a desktop preview is included in this repository.
- npm ci and npm run build passed. Four offline helper tests passed, including split SSE JSON and Persian UTF-8.
- Browser upload, embedding, question and streamed response flow passed with mocked API responses.

## Reproduce

Run `python scripts/check_project.py` with Python 3 and Node.js. Project-specific test/build commands are in README.md.

## Limits

Browser checks cover the documented flows and viewports, not every possible interaction or browser. No paid AI request, real checkout, email delivery, or production deployment was performed. The React builds report a non-fatal large-bundle warning. Remote CI results are separate from local checks. No claim of zero remaining defects or production certification is made.
