// How VALORANT battlepass XP is earned, as of Season 2026. Sources are noted
// inline; the README has the full list.

import type { Pass, Tier } from "./types";

const DAY = 24 * 60 * 60 * 1000;

/* ---------------------------------------------------------------- Modes -- */

export type ModeId = "unrated" | "swiftplay" | "quick" | "deathmatch";

/**
 * Average XP and daily-checkpoint points per match.
 * - Unrated/Comp/Premier: 100 XP per round played + 200 per round won. An
 *   evenly matched game is ~22 rounds with ~11 wins → 4,400 XP, 11 points.
 * - Swiftplay: same per-round XP, first to 5 → ~8 rounds, ~4 wins → 1,600.
 * - Spike Rush / TDM / Escalation: flat ~1,000 XP, 2 checkpoint points.
 * - Deathmatch: flat 900 XP and earns no daily points.
 * (wiki.playvalorant.com/en-us/Experience, /Dailies_and_Missions)
 */
export const MODES: Record<
	ModeId,
	{
		label: string;
		hint: string;
		xp: number;
		dailyPoints: number;
		/** How much one game moves weekly missions vs. a full Unrated game. */
		weeklyWeight: number;
	}
> = {
	unrated: {
		label: "Unrated / Comp",
		hint: "~4,400 XP a game",
		xp: 4400,
		dailyPoints: 11,
		weeklyWeight: 1,
	},
	swiftplay: {
		label: "Swiftplay",
		hint: "~1,600 XP a game",
		xp: 1600,
		dailyPoints: 4,
		weeklyWeight: 0.5,
	},
	quick: {
		label: "Spike Rush / TDM",
		hint: "~1,000 XP a game",
		xp: 1000,
		dailyPoints: 2,
		weeklyWeight: 0.3,
	},
	deathmatch: {
		label: "Deathmatch",
		hint: "900 XP, no dailies",
		xp: 900,
		dailyPoints: 0,
		weeklyWeight: 0,
	},
};

export const MODE_IDS = Object.keys(MODES) as ModeId[];

/* ----------------------------------------------------------- Constants -- */

/** 4 daily checkpoints × 1,000 XP, each needing 4 points. */
export const DAILY_CHECKPOINTS = 4;
export const DAILY_CHECKPOINT_XP = 1000;
const POINTS_PER_CHECKPOINT = 4;
/** A skipped day doubles one checkpoint the next time you play, up to 3 stacked. */
const MAX_BONUS_CHECKPOINTS = 3;

export const WEEKLY_MISSIONS = 3;
/**
 * Riot doesn't publish weekly mission XP. Season 2026 Act V ran 23,040 →
 * 38,400 XP per mission; we take the floor to stay conservative. Players can
 * overwrite it with what their Missions tab shows.
 */
export const DEFAULT_WEEKLY_MISSION_XP = 23040;
/**
 * Weeklies are things like "100 kills", "18,000 damage", "play 10 games" —
 * roughly 10 Unrated games clears a week's set. Deathmatch doesn't count.
 * Missions stockpile until the act ends, so this is a budget, not a weekly cap.
 */
const GAMES_PER_WEEKLY_SET = 10;

/** Match-XP boosts. Riot doesn't document stacking; we assume they add up. */
export const PREMIUM_BOOST = 0.03;
export const GAME_PASS_BOOST = 0.2;
export const PARTY_BOOST = [0, 0, 0.08, 0.12, 0.16, 0.2] as const;

/* -------------------------------------------------------------- Inputs -- */

export type Plan = {
	/** Typical games per play day, by mode. */
	games: Record<ModeId, number>;
	daysPerWeek: number;
	premium: boolean;
	gamePass: boolean;
	partySize: number;
	/** Whether you bother with weekly missions at all. */
	weeklies: boolean;
	weeklyMissionXp: number;
	/** 50 = the main pass, 55 = including epilogue. */
	goalTier: number;
};

export const DEFAULT_PLAN: Plan = {
	games: { unrated: 2, swiftplay: 1, quick: 0, deathmatch: 0 },
	daysPerWeek: 5,
	premium: true,
	gamePass: false,
	partySize: 1,
	weeklies: true,
	weeklyMissionXp: DEFAULT_WEEKLY_MISSION_XP,
	goalTier: 50,
};

/** What you read off the battlepass screen. */
export type Reading = {
	/** The tier with the progress bar under it (still locked). */
	tier: number;
	/** "1,148 / 5,000 XP" → 1148. */
	xpInTier: number;
	/** "DAILIES 4/4". */
	dailiesDone: number;
	/** "MISSIONS 0/3". */
	missionsDone: number;
};

/* --------------------------------------------------------- Pass helpers -- */

export const allTiers = (pass: Pass): Tier[] =>
	pass.chapters.flatMap((c) => c.tiers);

export const maxTier = (pass: Pass) => allTiers(pass).length;

/** Cumulative XP needed to *complete* tier n (tier 1 is free). */
export function xpThrough(pass: Pass, n: number) {
	let sum = 0;
	for (const t of allTiers(pass)) if (t.tier <= n) sum += t.xp;
	return sum;
}

export const tierXp = (pass: Pass, n: number) =>
	allTiers(pass).find((t) => t.tier === n)?.xp ?? 0;

/** Total XP earned so far, from what's on screen. */
export const totalXp = (pass: Pass, tier: number, xpInTier: number) =>
	xpThrough(pass, tier - 1) + xpInTier;

/** The inverse: which tier you're on given total XP. */
export function positionAt(pass: Pass, xp: number) {
	let acc = 0;
	for (const t of allTiers(pass)) {
		if (t.xp === 0) continue;
		if (xp < acc + t.xp) return { tier: t.tier, xpInTier: xp - acc };
		acc += t.xp;
	}
	return { tier: maxTier(pass) + 1, xpInTier: 0 };
}

/** Highest tier completely unlocked with this much XP. */
export const completedTier = (pass: Pass, xp: number) =>
	positionAt(pass, xp).tier - 1;

/* -------------------------------------------------------------- Timing -- */

export function actClock(pass: Pass, now: Date) {
	const start = new Date(pass.startTime).getTime();
	const end = new Date(pass.endTime).getTime();
	const t = now.getTime();
	const totalDays = Math.round((end - start) / DAY);
	const daysLeft = Math.max(0, (end - t) / DAY);
	const weeks = Math.ceil(totalDays / 7);
	const week = Math.min(
		weeks,
		Math.floor(Math.max(0, t - start) / DAY / 7) + 1,
	);
	return { start, end, totalDays, daysLeft, weeks, week };
}

/* ---------------------------------------------------------- Estimation -- */

export function boostOf(plan: Plan) {
	return (
		(plan.premium ? PREMIUM_BOOST : 0) +
		(plan.gamePass ? GAME_PASS_BOOST : 0) +
		(PARTY_BOOST[plan.partySize] ?? 0)
	);
}

/** XP on a day you play, split by source. Boosts only touch match XP. */
export function playDay(plan: Plan, games = plan.games) {
	let base = 0;
	let points = 0;
	for (const id of MODE_IDS) {
		base += games[id] * MODES[id].xp;
		points += games[id] * MODES[id].dailyPoints;
	}
	const checkpoints = Math.min(
		DAILY_CHECKPOINTS,
		Math.floor(points / POINTS_PER_CHECKPOINT),
	);
	return {
		match: Math.round(base * (1 + boostOf(plan))),
		dailies: checkpoints * DAILY_CHECKPOINT_XP,
		checkpoints,
	};
}

/** Average XP per calendar day across a typical week (excluding weeklies). */
export function averageDay(plan: Plan, games = plan.games) {
	const day = playDay(plan, games);
	const days = Math.min(7, Math.max(0, plan.daysPerWeek));
	const skipped = 7 - days;
	// Skipped days bank a doubled checkpoint for your next session.
	const bonus =
		days > 0
			? Math.min(skipped, MAX_BONUS_CHECKPOINTS, day.checkpoints) *
				DAILY_CHECKPOINT_XP
			: 0;
	return ((day.match + day.dailies) * days + bonus) / 7;
}

export type Forecast = {
	now: number;
	currentXp: number;
	goalXp: number;
	remaining: number;
	daysLeft: number;
	/** XP/day needed from here to finish exactly on the last day. */
	neededPerDay: number;
	/** Expected XP/day from the plan (or measured pace). */
	perDay: number;
	weekliesLeft: number;
	todaysDailiesLeft: number;
	projectedXp: number;
	projectedTier: number;
	/** Null if you won't make it before the act ends. */
	finishDate: number | null;
	onTrack: boolean;
	tiersShort: number;
	vpToFinish: number;
	/** Games per play day (in your usual mix) needed to make it. Null = not reachable. */
	gamesNeeded: number | null;
};

type ForecastInput = {
	pass: Pass;
	reading: Reading;
	plan: Plan;
	now: Date;
	/** Override the plan's XP/day with a measured pace (already includes everything). */
	measuredPerDay?: number;
};

/** Weekly mission XP still on the table for the rest of the act. */
export function weeklyAvailable(pass: Pass, reading: Reading, now: Date) {
	const { weeks, week } = actClock(pass, now);
	return Math.max(
		0,
		(weeks - week + 1) * WEEKLY_MISSIONS - reading.missionsDone,
	);
}

/** How much of it your play schedule will actually clear. */
function weeklyLeft(
	pass: Pass,
	reading: Reading,
	plan: Plan,
	now: Date,
	games = plan.games,
) {
	if (!plan.weeklies) return 0;
	const available = weeklyAvailable(pass, reading, now);
	const effortPerWeek =
		MODE_IDS.reduce((n, id) => n + games[id] * MODES[id].weeklyWeight, 0) *
		Math.min(7, plan.daysPerWeek);
	const weeksLeft = actClock(pass, now).daysLeft / 7;
	const clearable =
		(effortPerWeek * weeksLeft * WEEKLY_MISSIONS) / GAMES_PER_WEEKLY_SET;
	return Math.round(Math.min(available, clearable) * plan.weeklyMissionXp);
}

function expectedGain(
	input: ForecastInput,
	days: number,
	games?: Plan["games"],
) {
	const { pass, reading, plan, now, measuredPerDay } = input;
	if (measuredPerDay !== undefined && !games) return measuredPerDay * days;
	const todaysDailies =
		(DAILY_CHECKPOINTS - reading.dailiesDone) * DAILY_CHECKPOINT_XP;
	const daily = averageDay(plan, games);
	const left = actClock(pass, now).daysLeft;
	const share = left > 0 ? Math.min(1, days / left) : 1;
	return (
		daily * days +
		// Leftover dailies today only count if your usual day would finish them.
		Math.min(todaysDailies, playDay(plan, games).dailies) * Math.min(1, days) +
		weeklyLeft(pass, reading, plan, now, games) * share
	);
}

export function forecast(input: ForecastInput): Forecast {
	const { pass, reading, plan, now } = input;
	const goalTier = Math.min(plan.goalTier, maxTier(pass));
	const currentXp = totalXp(pass, reading.tier, reading.xpInTier);
	const goalXp = xpThrough(pass, goalTier);
	const remaining = Math.max(0, goalXp - currentXp);
	const { daysLeft } = actClock(pass, now);

	// XP past the last epilogue tier doesn't go anywhere.
	const projectedXp = Math.min(
		xpThrough(pass, maxTier(pass)),
		currentXp + expectedGain(input, daysLeft),
	);
	const projectedTier = Math.min(
		maxTier(pass),
		completedTier(pass, projectedXp),
	);

	// Walk forward a day at a time to find when you'd cross the line.
	let finishDate: number | null = null;
	if (remaining === 0) finishDate = now.getTime();
	else {
		for (let d = 1; d <= Math.ceil(daysLeft); d++) {
			if (expectedGain(input, Math.min(d, daysLeft)) >= remaining) {
				finishDate = now.getTime() + d * DAY;
				break;
			}
		}
	}

	// Smallest number of games per play day (same mode mix) that gets there.
	let gamesNeeded: number | null = null;
	const totalGames = MODE_IDS.reduce((n, id) => n + plan.games[id], 0);
	const mix =
		totalGames > 0
			? plan.games
			: { unrated: 1, swiftplay: 0, quick: 0, deathmatch: 0 };
	const mixSize = totalGames > 0 ? totalGames : 1;
	if (remaining === 0) gamesNeeded = 0;
	else if (plan.daysPerWeek > 0) {
		for (let g = 0; g <= 40; g += 0.5) {
			const games = Object.fromEntries(
				MODE_IDS.map((id) => [id, (mix[id] / mixSize) * g]),
			) as Plan["games"];
			if (expectedGain(input, daysLeft, games) >= remaining) {
				gamesNeeded = g;
				break;
			}
		}
	}

	const tiersShort = Math.max(0, goalTier - projectedTier);
	const epilogueStart =
		allTiers(pass).find((t) => t.epilogue)?.tier ?? Number.POSITIVE_INFINITY;
	// Epilogue tiers can't be bought.
	const buyable = Math.max(
		0,
		Math.min(goalTier, epilogueStart - 1) - projectedTier,
	);

	return {
		now: now.getTime(),
		currentXp,
		goalXp,
		remaining,
		daysLeft,
		neededPerDay: daysLeft > 0 ? remaining / daysLeft : remaining,
		perDay: daysLeft > 0 ? expectedGain(input, daysLeft) / daysLeft : 0,
		weekliesLeft: weeklyLeft(pass, reading, plan, now),
		todaysDailiesLeft:
			(DAILY_CHECKPOINTS - reading.dailiesDone) * DAILY_CHECKPOINT_XP,
		projectedXp,
		projectedTier,
		finishDate,
		onTrack: projectedXp >= goalXp,
		tiersShort,
		vpToFinish: buyable * 300,
		gamesNeeded,
	};
}

/* ------------------------------------------------------------- History -- */

export type Checkin = {
	at: number;
	tier: number;
	xpInTier: number;
	xp: number;
};

/**
 * Your real XP/day between your first and latest check-in. Needs at least a
 * day of history to say anything useful.
 */
export function measuredPace(checkins: Checkin[]) {
	if (checkins.length < 2) return null;
	const first = checkins[0];
	const last = checkins[checkins.length - 1];
	if (!first || !last) return null;
	const days = (last.at - first.at) / DAY;
	if (days < 1) return null;
	return { perDay: (last.xp - first.xp) / days, days };
}
