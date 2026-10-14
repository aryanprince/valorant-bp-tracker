import { describe, expect, test } from "bun:test";

import snapshot from "@/data/pass-snapshot.json";

import type { Pass } from "./types";
import {
	DEFAULT_PLAN,
	forecast,
	measuredPace,
	playDay,
	positionAt,
	totalXp,
	xpThrough,
} from "./xp";

const pass = snapshot as Pass;
const reading = { tier: 6, xpInTier: 1148, dailiesDone: 4, missionsDone: 0 };

describe("tier math", () => {
	test("matches Riot's published totals", () => {
		expect(xpThrough(pass, 50)).toBe(980_000);
		expect(xpThrough(pass, 55)).toBe(1_162_500);
	});

	test("reads the in-game progress bar", () => {
		// TIER 6, 1,148 / 5,000 XP → tiers 2–5 done (2000+2750+3500+4250).
		expect(totalXp(pass, 6, 1148)).toBe(13_648);
		expect(positionAt(pass, 13_648)).toEqual({ tier: 6, xpInTier: 1148 });
	});
});

describe("plan", () => {
	test("boosts only apply to match XP", () => {
		const plan = {
			...DEFAULT_PLAN,
			games: { unrated: 1, swiftplay: 0, quick: 0, deathmatch: 0 },
			premium: true,
			gamePass: true,
		};
		const day = playDay(plan);
		expect(day.match).toBe(Math.round(4400 * 1.23));
		expect(day.dailies).toBe(2000); // 11 points → 2 checkpoints
	});

	test("a casual week projects a sane finish", () => {
		const f = forecast({
			pass,
			reading,
			plan: DEFAULT_PLAN,
			now: new Date("2026-10-15T12:00:00Z"),
		});
		expect(f.remaining).toBe(980_000 - 13_648);
		expect(f.projectedTier).toBeGreaterThan(30);
		expect(f.projectedTier).toBeLessThanOrEqual(55);
		expect(f.gamesNeeded).not.toBeNull();
	});

	test("measured pace needs a day of history", () => {
		const day = 24 * 60 * 60 * 1000;
		expect(measuredPace([{ at: 0, tier: 2, xpInTier: 0, xp: 0 }])).toBeNull();
		expect(
			measuredPace([
				{ at: 0, tier: 2, xpInTier: 0, xp: 0 },
				{ at: 2 * day, tier: 5, xpInTier: 0, xp: 20_000 },
			]),
		).toEqual({ perDay: 10_000, days: 2 });
	});
});
