# Zydus Bill View

A small Next.js (App Router) front-end for viewing a product/catalog fetched from a Google Apps Script web app and creating simple purchase orders. The app uses client-side caching (localStorage) with a 24-hour TTL to minimize network requests.

## Key Features

- Cache-first catalog loading from a provided Apps Script API URL (24-hour TTL)
- Manual force-refresh on the Home page to reload and update cache
- Order form that uses cached catalog data to populate product selection
- Responsive UI: table view on desktop/tablet and card view on mobile
- Shared cache utility in `lib/catalogCache.js`

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Add your API endpoint in a project `.env` file (example provided):

```text
NEXT_PUBLIC_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

3. Start the development server:

```bash
npm run dev
```

4. Open http://localhost:3000 in your browser.

## Scripts

- `npm run dev` — start Next.js dev server
- `npm run build` — build for production
- `npm start` — run the production build
- `npm run lint` — run linter

## Environment

- Public client API environment key: `NEXT_PUBLIC_API_URL`
	- Location: `.env` at the project root
	- Note: This value is read client-side. Restart the dev server to pick up changes.

## Cache Behavior

- TTL: 24 hours (change `CACHE_TTL_MS` in `lib/catalogCache.js` to modify)
- Cache key: derived from the full API URL (so different endpoints do not collide)
- API shape expected:

```json
{ "status": "success", "data": [ /* array of product objects */ ] }
```

### Helper

Use the shared function `getCatalogData(endpoint, { forceRefresh })` exported from `lib/catalogCache.js`.

- `forceRefresh = false` (default): returns cached data if valid
- `forceRefresh = true`: bypasses cache, fetches fresh data, writes cache

## Files of Interest

- `app/page.tsx` — Home page: shows catalog table and exposes **Refresh Data**
- `app/Order/page.jsx` — Order form: auto-loads catalog from cache/API and provides order UI
- `lib/catalogCache.js` — Cache utility (localStorage) with 24-hour TTL
- `app/layout.tsx` and `app/globals.css` — global layout and styling
- `package.json` — scripts and dependencies

## UX Notes

- The Order page uses cached catalog data; there is no manual refresh there by design.
- The Home page filters out `qty`/`quantity` columns so it's focused on product metadata. Use the Order page to compose orders.

## Troubleshooting

- If you see `Missing NEXT_PUBLIC_API_URL`: ensure `.env` contains the `NEXT_PUBLIC_API_URL` key and restart the dev server.
- If the Home page shows `Error loading products`: inspect the network response from your Apps Script endpoint and ensure it returns the expected JSON structure.
- To clear cache manually in the browser console:

```js
// Remove cache for the current endpoint
localStorage.removeItem('catalog-cache-v1:' + encodeURIComponent('<your-endpoint>'));

// Remove all catalog-cache entries
Object.keys(localStorage).filter(k => k.startsWith('catalog-cache-v1:')).forEach(k => localStorage.removeItem(k));
```

## Developer Notes

- Client pages using hooks must include `"use client"` at the top of the file.
- Avoid impure functions during render (no `Date.now()` / `Math.random()` in initial state). Use `useRef` for stable IDs.
- Shared logic is placed in `lib/` for reuse across pages.

## Next Steps / Suggestions

- Add unit tests for `lib/catalogCache.js` (mock `localStorage` and `fetch`)
- Add a `last-updated` badge on Home to show `cachedAt`
- Type the catalog rows with TypeScript for better developer ergonomics

If you want, I can add tests for `lib/catalogCache.js` or add a short developer guide comment at the top of that file.
