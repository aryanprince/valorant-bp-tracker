// How VALORANT battlepass XP is earned, as of Season 2026. Sources are noted
// inline; the README has the full list.

import type { Pass, Tier } from "./types";

const DAY = 24 * 60 * 60 * 1000;

/* ---------------------------------------------------------------- Modes -- */

export type ModeId = "unrated" | "swiftplay" | "quick" | "deathmatch";

/**
 * Average XP and daily-checkpoint points per match.
 * - Unrated/Comp/Premier: 100 XP per round played + 200 per round won. An
 *   evenly matched game is ~22 rounds with ~11 wins: 4,400 XP, 11 points.
 * - Swiftplay: same per-round XP, first to 5, so ~8 rounds and ~4 wins: 1,600.
 * - Spike Rush / TDM / Escalation: flat ~1,000 XP, 2 checkpoint points.
 * - Deathmatch: flat 900 XP and earns no daily points.
 * (wiki.playvalorant.com/en-us/Experience, /Dailies_and_Missions, and the
 * in-game Daily Missions panel)
 */
export const MODES: Record<
	ModeId,
	{ label: string; short: string; xp: number; dailyPoints: number }
> = {
	unrated: {
		label: "Unrated / Comp",
		short: "Unrated / Comp",
		xp: 4400,
		dailyPoints: 11,
	},
	swiftplay: {
		label: "Swiftplay",
		short: "Swiftplay",
		xp: 1600,
		dailyPoints: 4,
	},
	quick: {
		label: "Spike Rush / TDM",
		short: "Spike Rush",
		xp: 1000,
		dailyPoints: 2,
	},
	deathmatch: {
		label: "Deathmatch",
		short: "Deathmatch",
		xp: 900,
		dailyPoints: 0,
	},
};

export const MODE_IDS = Object.keys(MODES) as ModeId[];

/* ----------------------------------------------------------- Constants -- */

/** 4 daily checkpoints × 1,000 XP, each needing 4 points. */
export const DAILY_CHECKPOINTS = 4;
export const DAILY_CHECKPOINT_XP = 1000;
const POINTS_PER_DAY = 16;
/** A skipped day doubles one checkpoint the next time you play, up to 3 stacked. */
const MAX_BONUS_CHECKPOINTS = 3;

export const WEEKLY_MISSIONS = 3;
/**
 * Riot doesn't publish weekly mission XP. Season 2026 Act VI week 1 shows
 * +15,800 XP per mission in-game. Later weeks have historically paid more,
 * so holding it flat is conservative. Players can update it each week.
 */
export const DEFAULT_WEEKLY_MISSION_XP = 15800;

/** Match-XP boosts. Riot doesn't document stacking; we assume they add up. */
export const PREMIUM_BOOST = 0.03;
export const GAME_PASS_BOOST = 0.2;
export const PARTY_BOOST = [0, 0, 0.08, 0.12, 0.16, 0.2] as const;

/** Riot's tier skip price (main tiers only, epilogue can't be bought). */
export const VP_PER_TIER = 300;

/* -------------------------------------------------------------- Inputs -- */

export type Settings = {
	premium: boolean;
	gamePass: boolean;
	partySize: number;
	daysPerWeek: number;
	dailies: boolean;
	weeklies: boolean;
	weeklyMissionXp: number;
	/** Which mode the headline answer is phrased in. */
	mode: ModeId;
};

export const DEFAULT_SETTINGS: Settings = {
	premium: true,
	gamePass: false,
	partySize: 1,
	daysPerWeek: 7,
	dailies: true,
	weeklies: true,
	weeklyMissionXp: DEFAULT_WEEKLY_MISSION_XP,
	mode: "unrated",
};

/** What you read off the battlepass screen. */
export type Reading = {
	/** The tier with the progress bar under it (still locked). */
	tier: number;
	/** "1,420 / 7,250 XP" → 1420. */
	xpInTier: number;
	/** "DAILIES 4/4". */
	dailiesDone: number;
	/** "MISSIONS 1/3". */
	missionsDone: number;
};

/* --------------------------------------------------------- Pass helpers -- */

export const allTiers = (pass: Pass): Tier[] =>
	pass.chapters.flatMap((c) => c.tiers);

export const maxTier = (pass: Pass) => allTiers(pass).length;

export const tierAt = (pass: Pass, n: number) =>
	allTiers(pass).find((t) => t.tier === n);

/** Cumulative XP needed to *complete* tier n (tier 1 is free). */
export function xpThrough(pass: Pass, n: number) {
	let sum = 0;
	for (const t of allTiers(pass)) if (t.tier <= n) sum += t.xp;
	return sum;
}

export const tierXp = (pass: Pass, n: number) => tierAt(pass, n)?.xp ?? 0;

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

/* --------------------------------------------------------- What to do -- */

export const boostOf = (s: Settings) =>
	(s.premium ? PREMIUM_BOOST : 0) +
	(s.gamePass ? GAME_PASS_BOOST : 0) +
	(PARTY_BOOST[s.partySize] ?? 0);

/** Boosted XP for one average game of a mode. */
export const gameXp = (s: Settings, mode: ModeId) =>
	MODES[mode].xp * (1 + boostOf(s));

/** Games a day it takes to clear all 4 daily checkpoints, or null if it can't. */
export const gamesForDailies = (mode: ModeId) => {
	const pts = MODES[mode].dailyPoints;
	return pts > 0 ? Math.ceil(POINTS_PER_DAY / pts) : null;
};

export type ModePlan = {
	mode: ModeId;
	/** Games still needed in total, on top of dailies and weeklies. */
	games: number;
	/** Spread over the play days left. */
	perDay: number;
	/** Games/day to clear dailies in this mode (null for Deathmatch). */
	dailiesFloor: number | null;
	/** What we'd actually tell you to play each day. */
	recommended: number;
	/** Your dailies alone already cover the match XP you need. */
	dailiesCover: boolean;
	/** Days until the goal if you play `recommended` games each play day. */
	finishInDays: number;
	/** Every game you'd play between now and the finish, at that rate. */
	totalGames: number;
};

export type Requirement = {
	/** Always the whole pass, epilogue included. */
	goalTier: number;
	currentXp: number;
	goalXp: number;
	remaining: number;
	daysLeft: number;
	playDaysLeft: number;
	neededPerDay: number;
	/** Where the remaining XP will come from. */
	sources: { weeklies: number; dailies: number; matches: number };
	weeklyMissionsLeft: number;
	todaysDailiesXp: number;
	modes: Record<ModeId, ModePlan>;
	nextUnlock: { tier: Tier; xpLeft: number } | null;
};

export function requirement({
	pass,
	reading,
	settings: s,
	now,
}: {
	pass: Pass;
	reading: Reading;
	settings: Settings;
	now: Date;
}): Requirement {
	const goalTier = maxTier(pass);
	const currentXp = totalXp(pass, reading.tier, reading.xpInTier);
	const goalXp = xpThrough(pass, goalTier);
	const remaining = Math.max(0, goalXp - currentXp);
	const clock = actClock(pass, now);
	const { daysLeft } = clock;
	const playShare = Math.min(7, Math.max(1, s.daysPerWeek)) / 7;
	const playDaysLeft = Math.max(1, daysLeft * playShare);

	const weeklyMissionsLeft = Math.max(
		0,
		(clock.weeks - clock.week + 1) * WEEKLY_MISSIONS - reading.missionsDone,
	);
	const weekliesXp = s.weeklies ? weeklyMissionsLeft * s.weeklyMissionXp : 0;

	const todaysDailiesXp =
		(DAILY_CHECKPOINTS - reading.dailiesDone) * DAILY_CHECKPOINT_XP;
	// Skipped days each bank one doubled checkpoint for later (max 3 at once).
	const catchUpPerWeek =
		Math.min(7 - Math.round(playShare * 7), MAX_BONUS_CHECKPOINTS) *
		DAILY_CHECKPOINT_XP;
	const futureDays = Math.max(0, Math.floor(daysLeft));
	const dailiesXp = s.dailies
		? todaysDailiesXp +
			futureDays * playShare * DAILY_CHECKPOINTS * DAILY_CHECKPOINT_XP +
			(futureDays / 7) * catchUpPerWeek
		: 0;

	// Missions are fixed-size pots; whatever's left has to come from matches.
	const weeklies = Math.min(remaining, weekliesXp);
	const dailies = Math.min(remaining - weeklies, dailiesXp);
	const matches = remaining - weeklies - dailies;

	const modes = Object.fromEntries(
		MODE_IDS.map((mode) => {
			const games = Math.ceil(matches / gameXp(s, mode));
			const perDay = games / playDaysLeft;
			const dailiesFloor = s.dailies ? gamesForDailies(mode) : null;
			const recommended = Math.max(Math.ceil(perDay), dailiesFloor ?? 0);
			// Playing the recommended amount usually beats the bare minimum, so
			// work out when that actually crosses the line (missions spread evenly).
			const xpPerDay =
				playShare *
					(recommended * gameXp(s, mode) +
						(s.dailies ? DAILY_CHECKPOINTS * DAILY_CHECKPOINT_XP : 0)) +
				(s.dailies ? catchUpPerWeek / 7 : 0) +
				(daysLeft > 0 ? weekliesXp / daysLeft : 0);
			const upfront = s.dailies ? todaysDailiesXp : 0;
			const finishInDays =
				remaining === 0
					? 0
					: Math.min(
							daysLeft,
							Math.max(0, remaining - upfront) / Math.max(1, xpPerDay),
						);
			const totalGames = Math.ceil(recommended * playShare * finishInDays);
			return [
				mode,
				{
					mode,
					games,
					perDay,
					dailiesFloor,
					recommended,
					dailiesCover: dailiesFloor !== null && perDay <= dailiesFloor,
					finishInDays,
					totalGames,
				},
			];
		}),
	) as Record<ModeId, ModePlan>;

	const next = tierAt(pass, reading.tier);
	return {
		goalTier,
		currentXp,
		goalXp,
		remaining,
		daysLeft,
		playDaysLeft,
		neededPerDay: daysLeft > 0 ? remaining / daysLeft : remaining,
		sources: { weeklies, dailies, matches },
		weeklyMissionsLeft,
		todaysDailiesXp,
		modes,
		nextUnlock:
			next && reading.tier <= maxTier(pass)
				? { tier: next, xpLeft: Math.max(0, next.xp - reading.xpInTier) }
				: null,
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

export type Projection = {
	projectedXp: number;
	projectedTier: number;
	finishDate: number | null;
	onTrack: boolean;
	tiersShort: number;
	vpToFinish: number;
};

/** Where your measured pace lands you by the end of the act. */
export function project(
	pass: Pass,
	req: Requirement,
	perDay: number,
	now: Date,
): Projection {
	const full = xpThrough(pass, maxTier(pass));
	const projectedXp = Math.min(full, req.currentXp + perDay * req.daysLeft);
	const projectedTier = Math.min(
		maxTier(pass),
		completedTier(pass, projectedXp),
	);
	const finishDate =
		req.remaining === 0
			? now.getTime()
			: perDay > 0 && req.remaining / perDay <= req.daysLeft
				? now.getTime() + (req.remaining / perDay) * DAY
				: null;
	const goal = req.goalTier;
	const epilogueStart =
		allTiers(pass).find((t) => t.epilogue)?.tier ?? Number.POSITIVE_INFINITY;
	const buyable = Math.max(
		0,
		Math.min(goal, epilogueStart - 1) - projectedTier,
	);
	return {
		projectedXp,
		projectedTier,
		finishDate,
		onTrack: projectedXp >= req.goalXp,
		tiersShort: Math.max(0, goal - projectedTier),
		vpToFinish: buyable * VP_PER_TIER,
	};
}
