import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { Header } from "@/components/header";
import { Footer, HowItWorks } from "@/components/how-it-works";
import { PaceChart } from "@/components/pace-chart";
import { PlanCard } from "@/components/plan-card";
import { ReadingCard } from "@/components/reading-card";
import { RewardGrid, TierTile } from "@/components/rewards";
import { Panel } from "@/components/ui";
import { Verdict } from "@/components/verdict";
import { fetchCurrentPass } from "@/functions/pass";
import { fmtDate } from "@/lib/format";
import { DEFAULT_READING, useTracker } from "@/lib/store";
import {
	actClock,
	allTiers,
	completedTier,
	forecast,
	measuredPace,
	tierXp,
	totalXp,
} from "@/lib/xp";

export const Route = createFileRoute("/")({
	loader: () => fetchCurrentPass(),
	component: Tracker,
});

/** Trust your logged pace over the plan once it covers a few days. */
const MEASURED_MIN_DAYS = 3;

function Tracker() {
	const pass = Route.useLoaderData();
	const tracker = useTracker(pass.id);

	// Re-render once a minute so "days left" doesn't freeze on a parked tab,
	// and only read the clock on the client to avoid hydration mismatches.
	const [now, setNow] = useState<Date | null>(null);
	useEffect(() => {
		setNow(new Date());
		const id = setInterval(() => setNow(new Date()), 60_000);
		return () => clearInterval(id);
	}, []);

	// Dailies reset every day and weeklies every week, so stale ticks don't count.
	const stored = tracker.reading ?? DEFAULT_READING;
	const at = tracker.readingAt;
	const reading = useMemo(() => {
		if (!now || !at) return stored;
		return {
			...stored,
			dailiesDone:
				new Date(at).toDateString() === now.toDateString()
					? stored.dailiesDone
					: 0,
			missionsDone:
				actClock(pass, new Date(at)).week === actClock(pass, now).week
					? stored.missionsDone
					: 0,
		};
	}, [stored, at, now, pass]);

	const pace = measuredPace(tracker.checkins);
	const useMeasured = !!pace && pace.days >= MEASURED_MIN_DAYS;

	const result = useMemo(() => {
		if (!now) return null;
		const input = { pass, reading, plan: tracker.plan, now };
		return {
			plan: forecast(input),
			measured: pace
				? forecast({ ...input, measuredPerDay: pace.perDay })
				: null,
		};
	}, [pass, reading, tracker.plan, now, pace]);

	const clock = now ? actClock(pass, now) : null;
	const main =
		result && (useMeasured && result.measured ? result.measured : result.plan);
	const currentXp = totalXp(pass, reading.tier, reading.xpInTier);
	const owned = completedTier(pass, currentXp);
	const upcoming = allTiers(pass).filter(
		(t) => t.tier >= reading.tier && t.tier < reading.tier + 6,
	);

	return (
		<>
			<Header />
			<main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:py-12">
				<section className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<p className="font-label font-semibold text-mist text-sm uppercase tracking-[0.25em]">
							{pass.stale ? "Latest battlepass" : "Current battlepass"}
						</p>
						<h1 className="font-display text-5xl text-bone uppercase leading-none sm:text-7xl">
							{pass.name}
						</h1>
						<p className="mt-2 font-label font-semibold text-lg uppercase tracking-wider">
							{clock && clock.daysLeft > 0 ? (
								<>
									Ends in{" "}
									<span className="text-gold">
										{Math.ceil(clock.daysLeft)} days
									</span>
									<span className="text-mist">
										{" "}
										· {fmtDate(pass.endTime, { year: "numeric" })} · Week{" "}
										{clock.week} of {clock.weeks}
									</span>
								</>
							) : (
								<span className="text-mist">
									{fmtDate(pass.startTime)} –{" "}
									{fmtDate(pass.endTime, { year: "numeric" })}
								</span>
							)}
						</p>
					</div>
				</section>

				{pass.stale && (
					<p className="border border-gold/40 bg-gold/5 px-4 py-3 text-gold text-sm">
						A new act may have started but its battlepass isn't published yet.
						This page updates by itself once it is — usually within a few hours
						of the patch.
					</p>
				)}

				<div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
					<ReadingCard
						pass={pass}
						reading={reading}
						isNew={tracker.ready && !tracker.reading}
						onChange={(r) =>
							tracker.setReading(r, totalXp(pass, r.tier, r.xpInTier))
						}
					/>
					<Verdict
						ready={tracker.ready && !!main}
						forecast={main}
						plan={tracker.plan}
						goalTier={tracker.plan.goalTier}
						usingMeasured={useMeasured}
						pace={pace}
						planForecast={result?.plan ?? null}
						checkins={tracker.checkins.length}
					/>
				</div>

				{main && clock && (
					<Panel
						title="Your pace"
						aside={
							<span className="font-label text-mist text-xs uppercase tracking-wider">
								{tracker.checkins.length > 1
									? `${tracker.checkins.length} days logged`
									: "Update daily to build your history"}
							</span>
						}
					>
						<PaceChart
							start={clock.start}
							end={clock.end}
							goalXp={main.goalXp}
							now={main.now}
							currentXp={main.currentXp}
							projectedXp={main.projectedXp}
							checkins={tracker.checkins}
						/>
					</Panel>
				)}

				<PlanCard
					plan={tracker.plan}
					onChange={tracker.setPlan}
					forecast={result?.plan ?? null}
				/>

				<Panel title="Up next">
					<div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
						{upcoming.map((t) => (
							<TierTile
								key={t.tier}
								tier={t}
								state={t.tier === reading.tier ? "current" : "locked"}
								progress={
									t.tier === reading.tier
										? reading.xpInTier / Math.max(1, tierXp(pass, t.tier))
										: undefined
								}
							/>
						))}
					</div>
				</Panel>

				<Panel
					title="All rewards"
					aside={
						<span className="flex gap-4 font-label text-xs uppercase tracking-wider">
							<span className="text-teal">◆ Unlocked</span>
							<span className="text-gold">◆ By act end</span>
						</span>
					}
				>
					<RewardGrid
						pass={pass}
						ownedThrough={owned}
						currentTier={reading.tier}
						currentProgress={
							reading.xpInTier / Math.max(1, tierXp(pass, reading.tier))
						}
						projectedThrough={main?.projectedTier ?? 0}
					/>
				</Panel>

				<HowItWorks />
			</main>
			<Footer fetchedAt={pass.fetchedAt} source={pass.source} />
		</>
	);
}
