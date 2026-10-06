# XRPet SI Companion™ — v3.9.0

**Don't watch the Ledger. Live with it.**

XRPet is a lightweight, installable companion built around Ripple, XRP and the XRP Ledger. It combines live XRPL WebSocket signals, XRP market data, official Ripple/XRPL updates, grounded Truth Mode, a customizable companion, local memory, evolution, daily missions, rooms, notifications and public-address wallet watching.

## Live product

Render service: https://xrpet-si-companion.onrender.com

## v3.9 capabilities

- Live XRPL ledger + fee signals
- XRP/USD market snapshot with public-data fallback
- Official Ripple + XRPL update feed\n- Ripple + XRP Living Archive from 2011 to present\n- Self-updating current-event layer merged into the historical timeline\n- Key-person directory covering XRPL creators and Ripple leadership\n- Searchable filters for legal, market, XRPL, adoption, acquisition and XRP events
- Catch Me Up / daily grounded briefing
- Truth Mode: CONFIRMED / LIKELY / SPECULATION / RUMOR / MISLEADING
- Companion name + personality
- Explanation-level preferences
- Local companion memory
- XP, streaks and seven evolution stages
- Daily 30-second mission
- Unlockable rooms/cosmetics
- Public XRPL wallet watch
- Local notification center
- Optional browser notifications
- Installable PWA + offline shell
- No proprietary token
- No custody and no private-key collection

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000.

## Architecture

- `public/app.js`: companion state, XRPL WebSocket client, UI, local memory/evolution/notifications
- `server.js`: XRP market feed, official-source aggregation, briefings, grounded companion response logic
- `public/sw.js`: offline PWA shell
- `wss://xrplcluster.com/`: live public XRPL WebSocket endpoint

## Privacy and wallet safety

v3.7 stores companion profile, XP, rooms, notification history, preferences, memories, and the watched public XRPL address in the user's browser local storage. The server does not need those values persisted.

**Never enter a seed phrase or private key into XRPet.** Wallet Watch accepts a public XRPL classic address only. Future transaction signing should use an external wallet handoff such as Xaman or another reputable XRPL wallet.

## SI design

The v3.7 SI layer is grounded and provider-neutral. It prioritizes:
1. live XRPL data,
2. public XRP market data,
3. official Ripple/XRPL sources,
4. explicit uncertainty labels.

A model provider can later be plugged into the same server endpoint for broader natural-language reasoning without changing the front end.

## Evolution

Drop → Ripple → Wave → Surge → Nexus → Titan → Legend

Evolution is driven by participation and learning, not investment size.

## Ripple + XRP Living Archive\n\nThe app includes a primary-source historical archive and automatically merges fresh official Ripple/XRPL headlines into the timeline. The live layer refreshes every five minutes while the app is open, while server-side official-source caching prevents unnecessary repeated requests. Ripple the company, XRP the asset, and XRPL the network are kept distinct.\n\n## Low-maintenance design

The app automatically reads public feeds and live XRPL events. It does not require the creator to manually post content each day.

## Not financial advice

XRPet reports market data and ecosystem information. It does not promise returns or price outcomes.


## v3.8 data-first interface

The normal XRPet interface is now focused on XRPL Live telemetry, Ripple/XRP settlement and history intelligence, and official announcements. Companion selection, rooms, cosmetics/equipment, wallet/NFT companion controls, and companion chat are moved behind the **Companion & Cosmetics** menu so they no longer crowd the primary information dashboard.


## v3.9 Ripplet companion

XRPet now has one official built-in companion: **Ripplet**. Ripplet is a small floating Ripple/XRP-inspired signal character with a white-silver shell, graphite seams, cyan energy, Ripple-style side-flow fins, and an XRP chest core.

The old built-in species roster and boy/girl companion selector are removed. Ripplet's identity is fixed so the app has one recognizable mascot. Users can still connect an XRPL account and optionally use eligible NFT artwork as a personal companion override, then restore Ripplet at any time.

Ripplet reacts to XRPL connection state, wallet activity, XRP market movement, announcements, scans, alerts, celebrations, and companion interactions. Rooms and subtle signal accents remain personalization layers without creating alternate built-in mascots.
