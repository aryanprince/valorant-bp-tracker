import { fmt, fmtCompact, fmtDate, fmtGames, plural } from "@/lib/format";
import type { Forecast, Plan } from "@/lib/xp";

import { cn, Panel, Stat } from "./ui";

const DAY = 24 * 60 * 60 * 1000;

export function Verdict({
	ready,
	forecast: f,
	planForecast,
	plan,
	goalTier,
	usingMeasured,
	pace,
	checkins,
}: {
	ready: boolean;
	forecast: Forecast | null;
	planForecast: Forecast | null;
	plan: Plan;
	goalTier: number;
	usingMeasured: boolean;
	pace: { perDay: number; days: number } | null;
	checkins: number;
}) {
	if (!ready || !f) {
		return (
			<Panel title="The verdict">
				<div className="h-64 animate-pulse bg-line/20" />
			</Panel>
		);
	}

	const done = f.remaining === 0;
	const daysEarly =
		f.finishDate !== null
			? Math.floor((f.now + f.daysLeft * DAY - f.finishDate) / DAY)
			: 0;
	const gamesPerDay = Object.values(plan.games).reduce((a, b) => a + b, 0);

	return (
		<Panel
			title="The verdict"
			aside={
				<span
					className={cn(
						"font-label font-semibold text-xs uppercase tracking-wider",
						usingMeasured ? "text-teal" : "text-mist",
					)}
				>
					{usingMeasured
						? `Based on your last ${Math.round(pace?.days ?? 0)} days`
						: "Based on your plan"}
				</span>
			}
		>
			<div
				className={cn(
					"border-l-4 py-1 pl-4",
					done || f.onTrack ? "border-teal" : "border-red",
				)}
			>
				{done ? (
					<Headline>
						Tier {goalTier} <span className="text-teal">done.</span> GG.
					</Headline>
				) : f.onTrack && f.finishDate !== null ? (
					<>
						<Headline>
							Tier {goalTier} by{" "}
							<span className="text-teal">{fmtDate(f.finishDate)}</span>
						</Headline>
						<p className="mt-2 text-bone/80">
							{daysEarly > 0
								? `${plural(daysEarly, "day")} before the act ends. You're good.`
								: "Right down to the wire — don't skip many days."}
						</p>
					</>
				) : (
					<>
						<Headline>
							You'll reach{" "}
							<span className="text-red">tier {f.projectedTier}</span>
						</Headline>
						<p className="mt-2 text-bone/80">
							{plural(f.tiersShort, "tier")} short of {goalTier} at this pace.
						</p>
					</>
				)}
			</div>

			{!done && !f.onTrack && (
				<ul className="mt-5 space-y-2 text-sm">
					{planForecast?.gamesNeeded != null ? (
						<Fix>
							Play{" "}
							<b className="text-bone">
								~{fmtGames(planForecast.gamesNeeded)} games
							</b>{" "}
							on each play day instead of {gamesPerDay}
							{plan.weeklies ? ", and clear your weeklies" : ""}.
						</Fix>
					) : (
						<Fix>
							Not reachable by playing alone with {plan.daysPerWeek} days a week
							— play more days, or…
						</Fix>
					)}
					{f.vpToFinish > 0 && (
						<Fix>
							Buy the last {plural(f.vpToFinish / 300, "tier")} for{" "}
							<b className="text-bone">{fmt(f.vpToFinish)} VP</b>
							{goalTier > 50 ? " (epilogue tiers can't be bought)" : ""}.
						</Fix>
					)}
				</ul>
			)}

			<div className="mt-6 grid grid-cols-2 gap-5">
				<Stat
					label="XP to go"
					value={fmtCompact(f.remaining)}
					sub={`${fmt(f.currentXp)} earned`}
				/>
				<Stat
					label="Days left"
					value={Math.ceil(f.daysLeft)}
					sub={`ends ${fmtDate(f.now + f.daysLeft * DAY)}`}
				/>
				<Stat
					label="Needed / day"
					value={fmtCompact(f.neededPerDay)}
					sub="to finish on the last day"
				/>
				<Stat
					label={usingMeasured ? "Your pace / day" : "Plan / day"}
					value={fmtCompact(f.perDay)}
					tone={f.perDay >= f.neededPerDay ? "teal" : "red"}
					sub={
						usingMeasured
							? "measured from your check-ins"
							: "matches + dailies + weeklies"
					}
				/>
			</div>

			{pace && !usingMeasured && (
				<p className="mt-5 text-mist text-xs">
					Measured so far: {fmt(pace.perDay)} XP/day over {pace.days.toFixed(1)}{" "}
					days. The verdict switches to your real pace after 3 days of
					check-ins.
				</p>
			)}
			{!pace && checkins <= 1 && (
				<p className="mt-5 text-mist text-xs">
					Come back and update your tier every day or two — after a few days
					this uses your real pace instead of estimates.
				</p>
			)}
		</Panel>
	);
}

function Headline({ children }: { children: React.ReactNode }) {
	return (
		<p className="font-display text-4xl text-bone uppercase leading-[0.95] sm:text-5xl">
			{children}
		</p>
	);
}

function Fix({ children }: { children: React.ReactNode }) {
	return (
		<li className="flex gap-3 text-bone/80">
			<span className="mt-1.5 size-2 shrink-0 rotate-45 bg-red" />
			<span>{children}</span>
		</li>
	);
}
