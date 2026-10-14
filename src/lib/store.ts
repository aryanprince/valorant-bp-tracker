// Everything lives in localStorage: no accounts, each browser is one player.

import { useCallback, useEffect, useState } from "react";

import {
	type Checkin,
	DEFAULT_SETTINGS,
	type Reading,
	type Settings,
} from "./xp";

const KEY = "bp-tracker:v1";

type Saved = {
	settings: Settings;
	/** Latest screen reading, per pass, with when it was entered. */
	readings: Record<string, Reading & { at?: number }>;
	/** At most one check-in per local day, per pass. */
	checkins: Record<string, Checkin[]>;
};

const EMPTY: Saved = { settings: DEFAULT_SETTINGS, readings: {}, checkins: {} };

export const DEFAULT_READING: Reading = {
	tier: 2,
	xpInTier: 0,
	dailiesDone: 0,
	missionsDone: 0,
};

function load(): Saved {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return EMPTY;
		const saved = JSON.parse(raw) as Partial<Saved> & {
			plan?: Partial<Settings>;
		};
		// The goal used to be a setting; it's always the full pass now.
		const { goalTier: _, ...settings } = {
			...DEFAULT_SETTINGS,
			...migrate(saved.plan),
			...saved.settings,
		} as Settings & { goalTier?: number };
		return {
			settings,
			readings: saved.readings ?? {},
			checkins: saved.checkins ?? {},
		};
	} catch {
		return EMPTY;
	}
}

/** v1 stored a "plan" whose defaults were wrong (5 days, 23,040 XP missions). */
function migrate(plan?: Partial<Settings> & { games?: unknown }) {
	if (!plan) return {};
	const { games: _, ...rest } = plan;
	if (rest.weeklyMissionXp === 23040) delete rest.weeklyMissionXp;
	if (rest.daysPerWeek === 5) delete rest.daysPerWeek;
	return rest;
}

const sameDay = (a: number, b: number) =>
	new Date(a).toDateString() === new Date(b).toDateString();

export function useTracker(passId: string) {
	const [saved, setSaved] = useState<Saved>(EMPTY);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		setSaved(load());
		setReady(true);
		const sync = (e: StorageEvent) => e.key === KEY && setSaved(load());
		window.addEventListener("storage", sync);
		return () => window.removeEventListener("storage", sync);
	}, []);

	const update = useCallback((fn: (s: Saved) => Saved) => {
		setSaved((prev) => {
			const next = fn(prev);
			localStorage.setItem(KEY, JSON.stringify(next));
			return next;
		});
	}, []);

	const setSettings = useCallback(
		(patch: Partial<Settings>) =>
			update((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
		[update],
	);

	/** Saves the reading and records/updates today's check-in when XP moved. */
	const setReading = useCallback(
		(reading: Reading, xp: number) =>
			update((s) => {
				const now = Date.now();
				const list = s.checkins[passId] ?? [];
				const last = list[list.length - 1];
				const entry = {
					at: now,
					tier: reading.tier,
					xpInTier: reading.xpInTier,
					xp,
				};
				const checkins =
					last && sameDay(last.at, now)
						? [...list.slice(0, -1), entry]
						: [...list, entry];
				return {
					...s,
					readings: { ...s.readings, [passId]: { ...reading, at: now } },
					checkins: { ...s.checkins, [passId]: checkins },
				};
			}),
		[passId, update],
	);

	const clearHistory = useCallback(
		() =>
			update((s) => {
				const { [passId]: _, ...checkins } = s.checkins;
				const { [passId]: __, ...readings } = s.readings;
				return { ...s, checkins, readings };
			}),
		[passId, update],
	);

	const stored = saved.readings[passId];
	return {
		ready,
		settings: saved.settings,
		reading: stored ?? null,
		readingAt: stored?.at ?? null,
		checkins: saved.checkins[passId] ?? [],
		setSettings,
		setReading,
		clearHistory,
	};
}
