# BP Tracker — VALORANT battlepass calculator

Punch in the numbers from your in-game battlepass screen (tier + XP on that tier,
optionally dailies/missions ticked), say roughly how you play, and see when you'll
finish — or how far short you'll land and what it'd take to close the gap.

No accounts. Everything is saved in your browser's localStorage, and each day you
update creates a check-in, so after a few days the verdict switches from estimates
to your real measured pace.

## Stack

TanStack Start (React 19, file routes, server functions) · Vite 8 · Tailwind v4 ·
Biome · Bun · deployed on Vercel via Nitro.

```sh
bun install
bun dev          # http://localhost:3000
bun test         # XP math tests
bun run check    # biome format + lint
```

## Where the data comes from

- **Battlepass contents & XP per tier** — [valorant-api.com](https://valorant-api.com),
  the community API mirrored from game files, usually updated within hours of a patch.
  The server picks the act whose `startTime ≤ now < endTime` and its Season contract,
  then resolves every reward's name and icon.
- **Bundled snapshot** — `src/data/pass-snapshot.json` is the current pass, served
  instantly while its act is running (a cold live fetch is ~70 upstream requests).
  When a new act starts the snapshot no longer covers today, so the site goes live
  on its own — no redeploy needed. Refresh it anytime with
  `bun scripts/snapshot-pass.ts` to keep cold starts fast.
- **Past passes** — `/passes` lists every act back to IGNITION: Act 1.

## The XP model (`src/lib/xp.ts`)

| Source | Value | Notes |
| --- | --- | --- |
| Tier N | `750 × N + 500` | Tier 1 free. 980,000 XP to 50, 1,162,500 with 5 × 36,500 epilogue tiers |
| Unrated / Comp / Swiftplay / Premier | 100 per round played + 200 per round won | ~4,400 avg Unrated, ~1,600 Swiftplay |
| Spike Rush / TDM · Deathmatch · Escalation | 1,000 · 900 · 800 (+200 win) | flat |
| Dailies | 4 checkpoints × 1,000 XP | 4 points each: 1/round won, 2/Spike Rush·TDM, 0/DM. Skipped day → one ×2 checkpoint later (max 3) |
| Weeklies | 3/week, stack until act end | **Riot doesn't publish values** — default 23,040/mission (Act V floor), editable. Capped by how many games you play (~10 Unrated games per week's set) |
| Boosts | Premium +3%, PC Game Pass +20%, party 2–5 +8–20% | Match XP only; assumed additive |

Sources: [Riot wiki — Experience](https://wiki.playvalorant.com/en-us/Experience),
[Dailies & Missions](https://wiki.playvalorant.com/en-us/Dailies_and_Missions),
[Battle Pass](https://wiki.playvalorant.com/en-us/Battle_Pass),
[Battlepass FAQ](https://support.riotgames.com/en-us/valorant/gameplay/battlepass-faq),
[Game Pass perks](https://www.riotgames.com/en/riot-game-pass-benefits).

Fan-made, not affiliated with Riot Games.
