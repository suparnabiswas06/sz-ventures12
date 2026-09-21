# SZ Ventures

Production website for SZ Ventures.

## Architecture

This is intentionally a static multi-page site. It has no framework runtime dependency and can be served directly from a CDN/static host.

- Static HTML for fast delivery and low operational complexity
- Shared CSS/JS assets under `assets/`
- Clean URL rewrites at the edge
- Security headers in `vercel.json`
- GitHub Actions validates HTML entry points, JavaScript syntax and SEO files

## Deployment

Import this repository into Vercel, select the production branch `main`, and attach the intended SZ Ventures domain.

The site itself requires no build command and no output directory.

## Repository hygiene

Do not commit secrets, `.env*`, `.vercel/`, `node_modules/`, or editor/OS metadata.
