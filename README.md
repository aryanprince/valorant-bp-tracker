# BP Tracker: VALORANT battlepass calculator

Copy four numbers off the in-game battlepass screen (tier, XP on that tier,
dailies, weekly missions) and it tells you what to play: e.g. "2 Unrated games a
day", the games left, where the remaining XP comes from, and the next unlock.

No accounts. Everything is saved in your browser's localStorage. Each day you
update becomes a check-in, and after a day the tracker compares your real pace
against the plan.

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

- **Battlepass contents & XP per tier** from [valorant-api.com](https://valorant-api.com),
  the community API mirrored from game files, usually updated within hours of a patch.
  The server picks the act whose `startTime ≤ now < endTime` and its Season contract,
  then resolves every reward's name and icon.
- **Bundled snapshot**: `src/data/pass-snapshot.json` is the current pass, served
  instantly while its act is running (a cold live fetch is ~70 upstream requests).
  When a new act starts the snapshot no longer covers today, so the site goes live
  on its own, no redeploy needed. Refresh it anytime with
  `bun scripts/snapshot-pass.ts` to keep cold starts fast.
- **Past passes**: `/passes` lists every act back to IGNITION: Act 1.

## The XP model (`src/lib/xp.ts`)

`requirement()` splits the XP you still need into weekly missions, daily
checkpoints and whatever's left for matches, then turns that into games per day
per mode (never fewer than it takes to clear dailies).

| Source | Value | Notes |
| --- | --- | --- |
| Tier N | `750 × N + 500` | Tier 1 free. 980,000 XP to 50, 1,162,500 with 5 × 36,500 epilogue tiers |
| Unrated / Comp / Swiftplay / Premier | 100 per round played + 200 per round won | ~4,400 avg Unrated, ~1,600 Swiftplay |
| Spike Rush / TDM · Deathmatch · Escalation | 1,000 · 900 · 800 (+200 win) | flat |
| Dailies | 4 checkpoints × 1,000 XP | 4 points each: 1/round won, 2/Spike Rush·TDM, 0/DM. A skipped day banks one ×2 checkpoint (max 3). ~2 Unrated games clear a day |
| Weeklies | 3/week, stack until act end | **Riot doesn't publish values.** Default 15,800/mission (Act VI week 1, read in-game), held flat as a conservative floor; editable in settings |
| Boosts | Premium +3%, PC Game Pass +20%, party 2–5 +8–20% | Match XP only; assumed additive |

Sources: [Riot wiki: Experience](https://wiki.playvalorant.com/en-us/Experience),
[Dailies & Missions](https://wiki.playvalorant.com/en-us/Dailies_and_Missions),
[Battle Pass](https://wiki.playvalorant.com/en-us/Battle_Pass),
[Battlepass FAQ](https://support.riotgames.com/en-us/valorant/gameplay/battlepass-faq),
[Game Pass perks](https://www.riotgames.com/en/riot-game-pass-benefits).

Fan-made, not affiliated with Riot Games.
