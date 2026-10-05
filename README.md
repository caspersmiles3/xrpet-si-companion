# XRPet SI Companion™ — v0.2

A lightweight living companion for the XRP Ledger. It combines real-time XRPL WebSocket signals, official Ripple/XRPL update aggregation, a provider-neutral SI companion core, Truth Mode labels, public-address wallet watching, and a tiny daily companion mission.

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000

## Deploy on Render

- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- No environment variables are required for the MVP.

## MVP architecture

- `public/app.js`: browser companion + XRPL WebSocket client
- `server.js`: official update aggregator + local SI behavior endpoint
- XRPL endpoint: `wss://xrplcluster.com/`
- Wallet watch uses only a public XRPL classic address. Never collect or store seed phrases/private keys.

## SI upgrade path

The current `/api/companion` endpoint is deliberately provider-neutral and works without an API key. Later, replace the local rules with an SI/LLM provider while preserving these safety rules:

1. Primary-source facts outrank secondary sources.
2. Label output as CONFIRMED / LIKELY / SPECULATION / RUMOR / MISLEADING.
3. Never claim price certainty or guaranteed returns.
4. Never request XRPL seed phrases or private keys.
5. Quote minimally; link to the source.
6. Separate Ripple-the-company news from XRPL protocol activity and XRP market activity.

## Next production upgrades

- Persistent users and companion state
- Secure auth
- Xaman/GemWallet wallet connection using signing handoff only
- Real XRP market data provider
- Notification preferences
- Scheduled official-source ingestion + database
- Model-backed SI summarization and claim verification
- Companion evolution and cosmetics
- Push notifications
- Companion rooms and cosmetics

## v0.2 additions

- Installable PWA manifest + service worker
- Persistent watched address, mood, streak and XP in local storage
- Offline shell for the core companion UI
- App icon asset
