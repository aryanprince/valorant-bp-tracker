import { describe, expect, test } from "bun:test";

import snapshot from "@/data/pass-snapshot.json";

import type { Pass } from "./types";
import {
	DEFAULT_SETTINGS,
	measuredPace,
	positionAt,
	project,
	requirement,
	totalXp,
	xpThrough,
} from "./xp";

const pass = snapshot as Pass;
const now = new Date("2026-10-14T18:00:00Z");
// Straight off Aryan's screen: Tier 9 Loyal Companions Card, 1,420 / 7,250 XP.
const reading = { tier: 9, xpInTier: 1420, dailiesDone: 4, missionsDone: 1 };

describe("tier math", () => {
	test("matches Riot's published totals", () => {
		expect(xpThrough(pass, 50)).toBe(980_000);
		expect(xpThrough(pass, 55)).toBe(1_162_500);
	});

	test("reads the in-game progress bar", () => {
		// Tiers 2–8 done: 2000+2750+3500+4250+5000+5750+6500 = 29,750.
		expect(totalXp(pass, 9, 1420)).toBe(31_170);
		expect(positionAt(pass, 31_170)).toEqual({ tier: 9, xpInTier: 1420 });
	});
});

describe("requirement", () => {
	const req = requirement({ pass, reading, settings: DEFAULT_SETTINGS, now });

	test("splits what's left into weeklies, dailies and matches", () => {
		expect(req.goalTier).toBe(55);
		expect(req.remaining).toBe(1_162_500 - 31_170);
		// 12 weeks × 3 missions, 1 already done, 15,800 each.
		expect(req.weeklyMissionsLeft).toBe(35);
		expect(req.sources.weeklies).toBe(35 * 15_800);
		// Today's dailies are done; 83 full days left at 4,000.
		expect(req.sources.dailies).toBe(83 * 4000);
		expect(
			req.sources.weeklies + req.sources.dailies + req.sources.matches,
		).toBe(req.remaining);
	});

	test("casual play is enough once dailies cover the match XP", () => {
		const unrated = req.modes.unrated;
		expect(unrated.dailiesFloor).toBe(2);
		expect(unrated.dailiesCover).toBe(true);
		expect(unrated.recommended).toBe(2);
	});

	test("next unlock is the tier on screen", () => {
		expect(req.nextUnlock?.tier.reward.name).toBe("Loyal Companions Card");
		expect(req.nextUnlock?.xpLeft).toBe(7250 - 1420);
	});

	test("skipping missions means a lot more games", () => {
		const grind = requirement({
			pass,
			reading,
			settings: { ...DEFAULT_SETTINGS, weeklies: false, dailies: false },
			now,
		});
		expect(grind.sources.matches).toBe(grind.remaining);
		expect(grind.modes.unrated.games).toBeGreaterThan(200);
	});
});

describe("history", () => {
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

	test("a slow pace comes up short and prices the gap", () => {
		const req = requirement({ pass, reading, settings: DEFAULT_SETTINGS, now });
		const p = project(pass, req, 5000, now);
		expect(p.onTrack).toBe(false);
		expect(p.finishDate).toBeNull();
		// Tiers 51-55 are the epilogue, which VP can't buy.
		expect(p.projectedTier).toBeLessThan(50);
		expect(p.vpToFinish).toBe((50 - p.projectedTier) * 300);
	});
});

describe("totals", () => {
	test("total games and finish date follow the recommended rate", () => {
		const req = requirement({ pass, reading, settings: DEFAULT_SETTINGS, now });
		const unrated = req.modes.unrated;
		// 2 a day, every day, until the finish line.
		expect(unrated.totalGames).toBe(Math.ceil(2 * unrated.finishInDays));
		expect(unrated.finishInDays).toBeLessThan(req.daysLeft);
		expect(unrated.totalGames).toBeGreaterThan(100);
		expect(unrated.totalGames).toBeLessThan(130);
	});
});
