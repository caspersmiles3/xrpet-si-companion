# XRPet SI Companion™ — v4.9.0

**Don't watch the Ledger. Live with it.**

XRPet is a lightweight, installable companion built around Ripple, XRP and the XRP Ledger. It combines live XRPL WebSocket signals, XRP market data, official Ripple/XRPL updates, grounded Truth Mode, a customizable companion, local memory, evolution, daily missions, rooms, notifications and public-address wallet watching.

## Live product

Render service: https://xrpet-si-companion.onrender.com

## v4.9 capabilities

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


## v4.0 navigation and rooms

- Primary navigation now top-aligns XRPL Live and Announcements instead of centering them mid-screen.
- Settlements + History is an expandable navigation menu with direct views for origins, Ripple, XRP, XRPL, legal/regulatory history, market cycles, adoption, acquisitions, and key people.
- Historical events include expandable detail panels explaining why each event matters.
- Companion & Cosmetics opens downward from the left sidebar.
- Rooms now use select → preview → **Apply Room & Close**, with an explicit close button.
- Added Genesis Chamber, Settlement City, Quantum Ledger Lab, Digital Oasis, and Arctic Node environments.


## v4.1 companion workspace fixes

- Master audio, interface sounds, room ambience, and XRPL pulse sounds default to ON. A one-time v4.1 migration also enables them for existing installs; after that, user settings are respected.
- Ripplet's live 3D host is persistent and no longer lives inside a hidden Companion panel, so the official companion remains visible throughout the primary XRPet interface.
- Ripplet Chat, Rooms, Ripplet Appearance, Wallet/NFT Override, and the Ripplet studio now open as in-app workspaces inside the existing XRPet shell instead of fixed full-screen overlays.
- Every companion workspace has a visible **Back to XRP Interface** control.
- Rooms retain **Apply Room & Close**, so selecting a room no longer requires the Escape key.


## v4.2 primary-view routing

- Added **Home** as the main XRPet landing view with the app explanation and Ripplet.
- **XRPL Live** is now an isolated view: clicking it shows only the live ledger panel, with a Home button at the top.
- **Announcements** is now an isolated view instead of scrolling past the history archive.
- **Settlements + History** keeps the detailed expandable archive/navigation layout.
- XRP market data, official announcements, and the living archive refresh every **60 seconds** while XRPet is open.
- Ripplet is shown on Home rather than floating over every primary data page.
- The Ripplet workspace is now a compact **single-column** in-app page.
- Removed Eye Signal, Chest Core, Head Hardware, Signal Trail, and the separate Ripplet Appearance workspace. The page now includes a clean reserved slot for the future final interactive 3D Ripplet model.


## v4.3 Ripplet life system

Home now includes a bounded companion habitat with a water fountain, food station, sleep pod, and Signal Friend social area. Ripplet has persistent simulated needs for food, water, rest, and social interaction. A lightweight autonomous behavior engine chooses activities from those needs, can roam between stations, watch the XRP Ledger, sleep, eat, drink, or socialize, and stores its state locally so time away from the app affects the routine.

The live 3D Ripplet layer is mounted inside the habitat instead of roaming over the whole application. Its renderer remains transparent and its movement container is clipped to the main Home habitat, preventing it from entering the sidebar or leaving the interface. Users can toggle roaming or use **Sit & Stay** to pin Ripplet's routine.


## v4.4 XRPL Live + history navigation

- Removed the duplicate **Explore the Archive** selector. The left-side **Settlements + History** dropdown is now the sole archive navigator.
- Selecting Origins / Genesis, Ripple, XRP, XRPL, Legal, Market, Adoption, Acquisitions, or People opens a dedicated view containing only that subject. Overview + Full Timeline retains the complete archive.
- XRPL Live has been expanded into a larger data workspace with larger market/network cards.
- Added a live public XRPL transaction stream with transaction type, delivered amount, sender, destination, ledger index, sequence, fee, result/status, flags, destination tag when present, ticket sequence when present, and transaction hash.
- XRPet never displays or requests XRPL wallet seeds/private keys; those are secret signing credentials and are not part of public ledger transaction data.
- A compact XRP/USD ticker now stays at the top of every XRPet screen and links back to XRP Live.


## v4.5 cinematic companion upgrade

- Added a cinematic Ripple/XRP launch gate with depth, Ripple-style energy arcs, a metallic XRP-inspired monolith, floor reflection, and Ripplet reveal.
- Added **Ripplet** as its own primary left-side tab. The tab is Ripplet's home base for identity, memory, reactions, daily pulse, and NFT override.
- Ripplet itself now lives across XRPet in one transparent global roaming layer bounded to the main interface. The layer cannot enter the left sidebar or leave the XRPet workspace.
- Removed the visible companion box/frame from the roaming layer and retained the Three.js alpha renderer.
- Replaced the Home-only pet habitat with a permanent top ecosystem bar visible on every primary screen.
- The ecosystem stations are now visually modeled as cinematic hardware: a metallic/glass Water Fountain, energy Food Station, illuminated Sleep Pod, and holographic Signal Friend dock.
- Ripplet behavior is tied to live data:
  - **Water** reacts to XRPL transaction flow.
  - **Food** reacts to XRP price movement.
  - **Sleep** reacts to extended transaction quiet.
  - **Signal Friend** reacts to new official Ripple/XRPL announcements.
- Ripplet returns to roaming after short Water/Food/Signal Friend visits and can still be pinned with **Sit & Stay**.
- XRP Live remains the large data workspace and its transaction cards now include public timestamp and memo data when present, in addition to type, amount, sender, destination, tags, ledger, sequence, fee, status, flags, tickets, and hash.
- Announcements now use a cleaner official-feed layout with primary-source status and last refresh time.
- The XRP/USD strip and Ripplet ecosystem remain at the top across Home, XRP Live, History, Announcements, and Ripplet.


## v4.6 live reactions, cleaner UI, visitor ticker

- Ripplet now has a non-repeating reaction library for Water, Food, Sleep, and Signal Friend activity. Each system has three distinct reaction sequences and XRPet avoids immediately repeating the same sequence for the same activity.
- Home has been simplified around the core XRPet purpose, network state, Ripplet state, visitor count, and four direct actions.
- XRPL Live has a cleaner hero, flatter telemetry cards, and simplified transaction summaries. Detailed public fields remain available by expanding a transaction.
- Added a live visitor ticker in the top bar and Home. A browser receives a local visitor ID; the server counts that browser once during the current running server process. Open clients poll the counter and animate when it changes.


## v4.7 expressive Ripplet reactions

- Ripplet's live ecosystem reactions now use explicit physical animations rather than only generic body bobbing.
- Added expressive arm/forearm, head, eye/lid, leg, foot, body and core motion for Water, Food, Sleep and Signal Friend events.
- Ripplet's previously hidden procedural legs and feet are now visible in a small stylized form so kicks, curls and dance motions can be seen.
- Water reactions: **Cool Sip**, **Ledger Gulp**, **Flow Splash**.
- Food reactions: **Core Bite**, **Market Taste**, **Energy Charge**.
- Sleep reactions: **Quiet Curl**, **Ledger Dream**, **Deep Snore**.
- Signal Friend reactions: **Signal Wave**, **Signal High-Five**, **Signal Dance**.
- Each reaction variant has its own synthesized sound sequence. XRPet still avoids immediately repeating the same reaction variant for the same activity.


## v4.8 free roaming + XRPet cursor

- Ripplet's roaming and live-signal reactions are now separate systems. Automatic Water, Food, Sleep, and Signal Friend events animate wherever Ripplet currently is instead of forcing him to stand at a station.
- Free roaming continues even while live XRP/XRPL reactions are firing.
- Manual station taps can still guide Ripplet to a station temporarily.
- Ripplet receives new random waypoints every few seconds and uses a visible walk cycle with alternating arms, legs, feet, and body bounce.
- Added spontaneous non-network reactions so Ripplet can greet, scan, focus, wave, dance, or react between live data events.
- Quiet XRPL periods can still trigger sleep reactions, but they no longer freeze roaming.
- Added custom XRPet mouse cursors for desktop/fine-pointer devices: a cyan XRPet signal cursor and a distinct interactive pointer for buttons, links, transaction cards, and controls.


## v4.9 autonomous mind + XRP market chart

- Ripplet now has an autonomous decision system separate from his live reaction system.
- The local autonomous brain considers food, water, rest, social state, recent XRPL transaction activity, XRP price movement, announcements, and saved companion memory.
- When an external SI provider is configured, XRPet periodically asks it for a constrained behavior decision. Allowed choices are roam, drink, eat, sleep, socialize, scan, wave, dance, or focus. If the provider is unavailable or returns an invalid decision, local autonomy continues automatically.
- Ripplet may independently decide to physically visit Water, Food, Sleep, or Signal Friend. Live transaction/market reactions can still happen wherever he is.
- The Ripplet tab now shows current intention, current thought, and whether the last higher-level decision came from connected SI or local autonomy.
- XRP Live now includes a rolling XRP/USD market chart based on public Coinbase 5-minute candles, covering roughly the latest 24 hours and refreshing every 60 seconds.
- The chart includes high, low, aggregate XRP volume, time range, and direction styling. It is descriptive market data, not a forecast.
