import { useEffect, useMemo, useState } from "react";

import { DEFAULT_READING, useTracker } from "./store";
import type { Pass } from "./types";
import { actClock, measuredPace, project, requirement, totalXp } from "./xp";

/** Trust your logged pace once it covers a full day. */
const MIN_PACE_DAYS = 1;

/**
 * Everything the pages need about "you" for a pass: the saved reading (with
 * stale dailies/missions reset), settings, history and the derived numbers.
 */
export function useProgress(pass: Pass) {
	const tracker = useTracker(pass.id);

	// Only read the clock on the client to avoid hydration mismatches, and tick
	// once a minute so a parked tab doesn't freeze "days left". Before
	// hydration we render against the act start, invisibly.
	const [clientNow, setNow] = useState<Date | null>(null);
	useEffect(() => {
		setNow(new Date());
		const id = setInterval(() => setNow(new Date()), 60_000);
		return () => clearInterval(id);
	}, []);
	const now = clientNow ?? new Date(pass.startTime);

	const stored = tracker.reading ?? DEFAULT_READING;
	const at = tracker.readingAt;
	// Dailies reset every day and weeklies every week, so stale ticks don't count.
	const reading = useMemo(() => {
		if (!clientNow || !at) return stored;
		const then = new Date(at);
		return {
			...stored,
			dailiesDone:
				then.toDateString() === clientNow.toDateString()
					? stored.dailiesDone
					: 0,
			missionsDone:
				actClock(pass, then).week === actClock(pass, clientNow).week
					? stored.missionsDone
					: 0,
		};
	}, [stored, at, clientNow, pass]);

	const req = useMemo(
		() => requirement({ pass, reading, settings: tracker.settings, now }),
		[pass, reading, tracker.settings, now],
	);

	const measured = measuredPace(tracker.checkins);
	const pace = measured && measured.days >= MIN_PACE_DAYS ? measured : null;
	const projection = pace
		? project(pass, req, pace.perDay, tracker.settings.goalTier, now)
		: null;

	return {
		...tracker,
		ready: tracker.ready && clientNow !== null,
		now,
		reading,
		req,
		pace,
		projection,
		setReading: (r: typeof reading) =>
			tracker.setReading(r, totalXp(pass, r.tier, r.xpInTier)),
	};
}
