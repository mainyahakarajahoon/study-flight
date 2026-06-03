# Focus Flight ✈ — Study Timer

Turn a focus session into a flight. Pick two airports, tear your boarding pass,
and study while a live great-circle map tracks your "flight" to the destination.

A single-page **React + Vite + TailwindCSS** app. No backend — all data
(9,000+ airports, world geography, country borders) is bundled and runs in the browser.

## Screens
1. **FIDS Departures** — airport split-flap board; build your itinerary (great-circle distance + duration).
2. **Boarding Pass** — drag the perforation to tear the ticket, then board.
3. **In-flight Cockpit** — full-screen black-gold world map that follows the aircraft, countdown ring, realistic altitude/speed, notes (saved to localStorage), and a Web Audio cabin hum.
4. **Arrivals** — split-flap landing, confetti, study summary.

## Develop
```bash
npm install
npm run dev      # http://localhost:5173
```

## Build
```bash
npm run build    # outputs static site to ./dist
npm run preview  # preview the production build locally
```

## Deploy (Vercel)
This repo includes a `vercel.json`. From the project root:

```bash
npx vercel          # first run: log in + link the project (preview deploy)
npx vercel --prod   # production deploy
```

Or connect the GitHub repo at https://vercel.com/new for automatic deploys on every push.
Vercel auto-detects Vite (build `npm run build`, output `dist`).

Because it's a static SPA, any static host works too (Netlify, Cloudflare Pages,
GitHub Pages). For Netlify you can simply drag the `dist/` folder to
https://app.netlify.com/drop.
