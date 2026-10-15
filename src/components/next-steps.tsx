import { Check } from "lucide-react";

import { fmt, fmtCompact, fmtDate, plural } from "@/lib/format";
import {
	gameXp,
	MODE_IDS,
	MODES,
	type Projection,
	type Requirement,
	type Settings,
} from "@/lib/xp";

import { RewardArt } from "./rewards";
import {
	DaysSelect,
	GamePassToggle,
	PartyPicker,
	PremiumToggle,
	WeeklyXpInput,
} from "./setting-controls";
import { cn, Label, Panel, Stat } from "./ui";

const DAY = 24 * 60 * 60 * 1000;
/** Mode · a day · total · finish, shared by the header and each row. */
const ROW =
	"grid grid-cols-[minmax(0,1fr)_2rem_3.75rem_4.5rem] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_5rem_6rem_8rem]";

/** The answer: what to play from here to finish on time, in every mode. */
export function NextSteps({
	req,
	settings,
	onChange,
	endTime,
	pace,
	projection,
	now,
}: {
	req: Requirement;
	settings: Settings;
	now: number;
	onChange: (patch: Partial<Settings>) => void;
	endTime: string;
	pace: { perDay: number; days: number } | null;
	projection: Projection | null;
}) {
	const mode = settings.mode;
	const plan = req.modes[mode];
	const done = req.remaining === 0;
	const missions = settings.dailies || settings.weeklies;
	const fewest = Math.min(...MODE_IDS.map((id) => req.modes[id].totalGames));

	return (
		<Panel
			title="What to do"
			aside={<DaysSelect settings={settings} onChange={onChange} />}
		>
			{done ? (
				<Headline>
					Tier {req.goalTier} <span className="text-teal">done.</span> GG.
				</Headline>
			) : (
				<>
					<div
						className={cn(
							ROW,
							"pb-2 font-label font-semibold text-mist text-xs uppercase tracking-[0.15em]",
						)}
					>
						<span className="pl-2 sm:pl-3">Mode</span>
						<span className="whitespace-nowrap text-right">A day</span>
						<span className="text-right">Total</span>
						<span className="whitespace-nowrap pr-2 text-right sm:pr-3">
							Tier {req.goalTier} by
						</span>
					</div>
					<fieldset aria-label="Mode to plan around">
						{MODE_IDS.map((id) => {
							const m = req.modes[id];
							const on = id === mode;
							return (
								<button
									key={id}
									type="button"
									aria-pressed={on}
									onClick={() => onChange({ mode: id })}
									className={cn(
										ROW,
										"w-full border-line/60 border-t border-l-2 py-3 text-left transition",
										on
											? "border-l-teal bg-bone/[0.06]"
											: "border-l-transparent hover:bg-bone/[0.03]",
									)}
								>
									<span className="min-w-0 pl-2 sm:pl-3">
										<span className="block font-label font-semibold text-bone uppercase leading-tight tracking-wide sm:text-lg">
											{MODES[id].short}
										</span>
										<span className="block text-mist text-xs">
											{m.totalGames === fewest
												? "Fewest games"
												: m.dailiesFloor === null
													? "No daily points"
													: m.dailiesCover
														? "Clears dailies"
														: "Extra games"}
										</span>
									</span>
									<span
										className={cn(
											"text-right font-display text-[1.75rem] tabular-nums sm:text-4xl",
											on ? "text-teal" : "text-bone",
										)}
									>
										{m.recommended}
									</span>
									<span className="text-right font-display text-[1.75rem] text-bone tabular-nums sm:text-4xl">
										~{m.totalGames}
									</span>
									<span className="pr-2 text-right sm:pr-3">
										<span className="block font-label font-semibold text-bone tabular-nums sm:text-lg">
											{fmtDate(now + m.finishInDays * DAY)}
										</span>
										<span className="block text-mist text-xs">
											{inDays(m.finishInDays)}
										</span>
									</span>
								</button>
							);
						})}
					</fieldset>
					<p className="mt-4 max-w-xl text-bone/80 leading-relaxed">
						<b className="font-label font-semibold text-bone uppercase tracking-wide">
							{MODES[mode].short}:{" "}
						</b>
						{mode === "deathmatch" ? (
							<>
								Deathmatch doesn't count for dailies or weekly missions, so this
								assumes you clear those in other modes.
							</>
						) : plan.dailiesCover && missions ? (
							<>
								{plural(plan.recommended, "game")} a day is what clears your
								dailies. Keep doing{" "}
								{settings.weeklies ? "those and your weekly missions" : "those"}{" "}
								and you're done {daysEarly(plan.finishInDays, req.daysLeft)}.
							</>
						) : (
							<>
								{missions ? "Clear your missions too. " : ""}That's{" "}
								{plural(plan.games, "game")} of extra match XP on top of what{" "}
								{missions ? "missions give you" : "you have"}.
							</>
						)}
					</p>
					<p className="mt-2 text-mist text-sm">
						Competitive and Premier pay the same XP as Unrated (100 per round
						played, 200 per round won), so count them as Unrated / Comp.
					</p>
				</>
			)}

			<div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4">
				<Stat label="XP to go" value={fmtCompact(req.remaining)} />
				<Stat
					label="Days left"
					value={Math.ceil(req.daysLeft)}
					sub={`act ends ${fmtDate(endTime)}`}
				/>
				<Stat
					label="Extra games"
					value={plan.games}
					sub="beyond dailies & missions"
				/>
				<Stat
					label="XP a day"
					value={fmtCompact(req.neededPerDay)}
					sub="to finish on the last day"
				/>
			</div>

			<PaceLine
				pace={pace}
				projection={projection}
				goalTier={req.goalTier}
				endTime={endTime}
			/>
		</Panel>
	);
}

function PaceLine({
	pace,
	projection: p,
	goalTier,
	endTime,
}: {
	pace: { perDay: number; days: number } | null;
	projection: Projection | null;
	goalTier: number;
	endTime: string;
}) {
	if (!pace || !p) {
		return (
			<p className="mt-6 border-line/60 border-t pt-4 text-mist text-sm">
				Update your tier again tomorrow. After a day, this checks your real pace
				against the plan.
			</p>
		);
	}
	const daysEarly =
		p.finishDate !== null
			? Math.floor((new Date(endTime).getTime() - p.finishDate) / DAY)
			: 0;
	return (
		<div
			className={cn(
				"mt-6 border-l-4 py-2 pl-4",
				p.onTrack ? "border-teal bg-teal/5" : "border-red bg-red/5",
			)}
		>
			<p className="font-label font-semibold text-mist text-xs uppercase tracking-[0.2em]">
				Your real pace · {fmt(pace.perDay)} XP a day over{" "}
				{plural(Math.round(pace.days), "day")}
			</p>
			<p className="mt-1 text-bone">
				{p.onTrack && p.finishDate !== null ? (
					<>
						On track: tier {goalTier} by{" "}
						<b className="text-teal">{fmtDate(p.finishDate)}</b>
						{daysEarly > 0 && `, ${plural(daysEarly, "day")} early`}.
					</>
				) : (
					<>
						At this pace you'd end on{" "}
						<b className="text-red">tier {p.projectedTier}</b>,{" "}
						{plural(p.tiersShort, "tier")} short
						{p.vpToFinish > 0 &&
							` (${fmt(p.vpToFinish)} VP buys up to tier 50, the epilogue can't be bought)`}
						. Play a bit more than the plan above to catch up.
					</>
				)}
			</p>
		</div>
	);
}

function inDays(days: number) {
	const n = Math.ceil(days);
	return n < 1 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`;
}

function daysEarly(finishInDays: number, daysLeft: number) {
	const early = Math.floor(daysLeft - finishInDays);
	return early >= 1
		? `${plural(early, "day")} before the act ends`
		: "right as the act ends";
}

function Headline({ children }: { children: React.ReactNode }) {
	return (
		<p className="font-display text-5xl text-bone uppercase leading-[0.95] sm:text-6xl">
			{children}
		</p>
	);
}

/** Today's checklist, styled after the in-game missions popover. */
export function Today({
	req,
	settings,
	onChange,
	dailiesDone,
	missionsDone,
}: {
	req: Requirement;
	settings: Settings;
	onChange: (patch: Partial<Settings>) => void;
	dailiesDone: number;
	missionsDone: number;
}) {
	const mode = settings.mode === "deathmatch" ? "unrated" : settings.mode;
	const name = MODES[mode].short;
	const gamesFor = (xp: number) =>
		Math.max(1, Math.ceil(xp / gameXp(settings, mode)));
	const floor = req.modes[mode].dailiesFloor;
	const weeklyLeft = 3 - missionsDone;
	const next = req.nextUnlock;

	return (
		<Panel title="Today">
			<ul className="divide-y divide-line/60">
				<Row
					done={dailiesDone >= 4}
					title="Daily checkpoints"
					value={dailiesDone >= 4 ? "Done" : `+${fmt(req.todaysDailiesXp)} XP`}
					detail={
						dailiesDone >= 4
							? "Refills tomorrow"
							: floor
								? `~${floor - Math.floor((dailiesDone * floor) / 4)} ${name} games left today`
								: `${4 - dailiesDone} checkpoints left`
					}
				/>
				<Row
					done={weeklyLeft <= 0}
					title="Weekly missions"
					value={
						weeklyLeft <= 0
							? "Done"
							: `+${fmt(weeklyLeft * settings.weeklyMissionXp)} XP`
					}
					detail={
						weeklyLeft <= 0
							? "New set next week"
							: `${weeklyLeft} left this week · ${req.weeklyMissionsLeft} left this act`
					}
				/>
				{next && (
					<li className="flex items-center gap-3 py-3">
						<div className="grid size-12 shrink-0 place-items-center border border-line/70 bg-panel-2 p-1">
							<RewardArt reward={next.tier.reward} className="size-full" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="font-label font-semibold text-mist text-xs uppercase tracking-[0.2em]">
								Next unlock · Tier {next.tier.tier}
							</p>
							<p className="truncate font-label font-semibold text-bone uppercase tracking-wide">
								{next.tier.reward.name}
							</p>
						</div>
						<div className="text-right">
							<p className="font-label font-semibold text-bone tabular-nums">
								{fmt(next.xpLeft)} XP
							</p>
							<p className="text-mist text-xs">
								~{plural(gamesFor(next.xpLeft), `${name} game`)}
							</p>
						</div>
					</li>
				)}
			</ul>

			<div className="mt-4 space-y-2 border-line/60 border-t pt-4">
				<Label>Boosts on match XP</Label>
				<PremiumToggle settings={settings} onChange={onChange} />
				<GamePassToggle settings={settings} onChange={onChange} />
				<div className="pt-1">
					<PartyPicker settings={settings} onChange={onChange} />
				</div>
			</div>
			<Tip settings={settings} onChange={onChange} />
		</Panel>
	);
}

/** A nudge when you're skipping the cheapest XP there is. */
function Tip({
	settings: s,
	onChange,
}: {
	settings: Settings;
	onChange: (patch: Partial<Settings>) => void;
}) {
	const tip = !s.weeklies
		? {
				text: "Weekly missions are about half the pass. Even a few a week saves dozens of games.",
				patch: { weeklies: true },
			}
		: !s.dailies
			? {
					text: "Dailies are 4,000 XP a day for about 2 Unrated games. Cheapest XP in the game.",
					patch: { dailies: true },
				}
			: null;
	if (!tip) return null;
	return (
		<div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-gold border-l-2 bg-gold/5 px-3 py-2 text-bone/80 text-sm">
			<p className="min-w-0 flex-1">
				<span className="font-label font-semibold text-gold uppercase tracking-wider">
					Tip ·{" "}
				</span>
				{tip.text}
			</p>
			<button
				type="button"
				onClick={() => onChange(tip.patch)}
				className="border border-gold/60 px-3 py-1 font-label font-semibold text-gold text-xs uppercase tracking-wider transition hover:bg-gold/10"
			>
				Count them
			</button>
		</div>
	);
}

function Row({
	done,
	title,
	value,
	detail,
}: {
	done: boolean;
	title: string;
	value: string;
	detail: string;
}) {
	return (
		<li className="flex items-center gap-3 py-3 first:pt-0">
			<span
				className={cn(
					"grid size-6 shrink-0 rotate-45 place-items-center border-2",
					done ? "border-teal bg-teal/15" : "border-line",
				)}
			>
				{done && (
					<Check className="size-3.5 -rotate-45 text-teal" strokeWidth={3} />
				)}
			</span>
			<div className="min-w-0 flex-1">
				<p className="font-label font-semibold text-bone uppercase tracking-wide">
					{title}
				</p>
				<p className="text-mist text-xs">{detail}</p>
			</div>
			<p
				className={cn(
					"font-label font-semibold tabular-nums",
					done ? "text-teal" : "text-bone",
				)}
			>
				{value}
			</p>
		</li>
	);
}

/** One bar: how the XP you still need splits across missions and matches. */
export function XpSources({
	req,
	settings,
	onChange,
}: {
	req: Requirement;
	settings: Settings;
	onChange: (patch: Partial<Settings>) => void;
}) {
	const { weeklies, dailies, matches } = req.sources;
	const total = Math.max(1, req.remaining);
	const mode = settings.mode;
	const parts = [
		{
			key: "weeklies",
			label: "Weekly missions",
			xp: weeklies,
			color: "bg-teal",
			note: settings.weeklies
				? `${req.weeklyMissionsLeft} missions × ${fmt(settings.weeklyMissionXp)} XP`
				: "Turned off in settings",
		},
		{
			key: "dailies",
			label: "Daily checkpoints",
			xp: dailies,
			color: "bg-bone",
			note: settings.dailies
				? `${fmt(DAILY_XP)} XP on each day you play`
				: "Turned off in settings",
		},
		{
			key: "matches",
			label: "Extra match XP",
			xp: matches,
			color: "bg-red",
			note:
				matches > 0
					? `~${plural(req.modes[mode].games, `${MODES[mode].short} game`)}`
					: "Missions cover it",
		},
	];

	return (
		<Panel title={`Where your ${fmtCompact(req.remaining)} XP comes from`}>
			<div className="flex h-3 gap-0.5 overflow-hidden">
				{parts.map(
					(p) =>
						p.xp > 0 && (
							<div
								key={p.key}
								className={p.color}
								style={{ width: `${(p.xp / total) * 100}%` }}
							/>
						),
				)}
			</div>
			<dl className="mt-5 grid gap-4 sm:grid-cols-3">
				{parts.map((p) => (
					<div key={p.key} className="flex gap-3">
						<span
							className={cn("mt-1.5 size-2.5 shrink-0 rotate-45", p.color)}
						/>
						<div>
							<dt className="font-label font-semibold text-mist text-xs uppercase tracking-[0.2em]">
								{p.label}
							</dt>
							<dd className="font-display text-2xl text-bone tabular-nums">
								{fmtCompact(p.xp)}{" "}
								<span className="font-label text-base text-mist">
									{Math.round((p.xp / total) * 100)}%
								</span>
							</dd>
							<dd className="text-mist text-xs">{p.note}</dd>
						</div>
					</div>
				))}
			</dl>
			<div className="mt-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-line/60 border-t pt-4">
				<p className="max-w-xl text-mist text-xs leading-relaxed">
					Missions are the cheap XP: a casual player who clears them barely
					needs extra games. Riot doesn't publish weekly mission XP, so we use
					this week's in-game value (hover MISSIONS in VALORANT, each one shows
					+XP). Later weeks usually pay more, so this errs on the safe side.
				</p>
				{settings.weeklies && (
					<div className="w-full sm:w-56">
						<Label>XP per weekly mission</Label>
						<WeeklyXpInput
							settings={settings}
							onChange={onChange}
							className="max-w-none"
						/>
					</div>
				)}
			</div>
		</Panel>
	);
}

const DAILY_XP = 4000;
