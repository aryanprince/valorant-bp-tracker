import { Check } from "lucide-react";

import { fmt, fmtCompact, fmtDate, plural } from "@/lib/format";
import {
	gameXp,
	MODE_IDS,
	MODES,
	type ModeId,
	type Projection,
	type Requirement,
	type Settings,
} from "@/lib/xp";

import { RewardArt } from "./rewards";
import { cn, Panel, Stat } from "./ui";

const DAY = 24 * 60 * 60 * 1000;

/** The answer: what to play from here to finish on time. */
export function NextSteps({
	req,
	settings,
	onMode,
	endTime,
	pace,
	projection,
}: {
	req: Requirement;
	settings: Settings;
	onMode: (mode: ModeId) => void;
	endTime: string;
	pace: { perDay: number; days: number } | null;
	projection: Projection | null;
}) {
	const mode = settings.mode;
	const plan = req.modes[mode];
	const name = MODES[mode].short;
	const done = req.remaining === 0;
	const totalGames = Math.round(plan.recommended * req.playDaysLeft);
	const missions = settings.dailies || settings.weeklies;
	const perWeek = settings.daysPerWeek < 7;

	return (
		<Panel
			title="What to do"
			aside={
				<div className="flex flex-wrap justify-end gap-1">
					{MODE_IDS.map((id) => (
						<button
							key={id}
							type="button"
							aria-pressed={id === mode}
							onClick={() => onMode(id)}
							className={cn(
								"px-2 py-1 font-label font-semibold text-xs uppercase tracking-wider transition",
								id === mode ? "bg-bone text-ink" : "text-mist hover:text-bone",
							)}
						>
							{MODES[id].short}
						</button>
					))}
				</div>
			}
		>
			{done ? (
				<Headline>
					Tier {settings.goalTier} <span className="text-teal">done.</span> GG.
				</Headline>
			) : (
				<>
					<p className="font-label font-semibold text-mist text-sm uppercase tracking-[0.2em]">
						Play {perWeek ? `${settings.daysPerWeek} days a week` : "every day"}
					</p>
					<Headline>
						<span className="text-teal">{plan.recommended}</span> {name}{" "}
						{plan.recommended === 1 ? "game" : "games"}{" "}
						<span className="text-bone/60">a day</span>
					</Headline>
					<p className="mt-3 max-w-xl text-bone/80 leading-relaxed">
						{mode === "deathmatch" ? (
							<>
								Deathmatch doesn't count for dailies or weekly missions, so this
								assumes you clear those in other modes.
							</>
						) : plan.dailiesCover && missions ? (
							<>
								That's what clears your dailies. Keep doing{" "}
								{settings.weeklies ? "those and your weekly missions" : "those"}{" "}
								and you reach tier {settings.goalTier} by {fmtDate(endTime)}.
							</>
						) : (
							<>
								{missions ? "On top of your missions, that's " : "That's "}
								about {plural(plan.games, `${name} game`)} of match XP before{" "}
								{fmtDate(endTime)}.
							</>
						)}
					</p>
				</>
			)}

			<div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4">
				<Stat label="XP to go" value={fmtCompact(req.remaining)} />
				<Stat label="Days left" value={Math.ceil(req.daysLeft)} />
				<Stat
					label="Games left"
					value={done ? 0 : `~${totalGames}`}
					sub={`${name}, at that rate`}
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
				goalTier={settings.goalTier}
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
						{p.vpToFinish > 0 && ` (${fmt(p.vpToFinish)} VP to buy the rest)`}.
						Play a bit more than the plan above to catch up.
					</>
				)}
			</p>
		</div>
	);
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
	dailiesDone,
	missionsDone,
}: {
	req: Requirement;
	settings: Settings;
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
			<Tip settings={settings} />
		</Panel>
	);
}

/** One nudge towards the cheapest XP you're not getting yet. */
function Tip({ settings: s }: { settings: Settings }) {
	const tip = !s.weeklies
		? "Weekly missions are over half the pass. Even a few a week saves dozens of games."
		: !s.dailies
			? "Dailies are 4,000 XP a day for about 2 Unrated games. Cheapest XP in the game."
			: !s.gamePass
				? "Have PC Game Pass? Turn it on in settings for +20% match XP."
				: s.partySize < 2
					? "Queueing with a friend adds +8% match XP (up to +20% as a five-stack)."
					: "You're getting every boost going. Just keep clearing missions.";
	return (
		<p className="mt-4 border-gold border-l-2 bg-gold/5 px-3 py-2 text-bone/80 text-sm">
			<span className="font-label font-semibold text-gold uppercase tracking-wider">
				Tip ·{" "}
			</span>
			{tip}
		</p>
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
}: {
	req: Requirement;
	settings: Settings;
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
			<p className="mt-5 text-mist text-xs leading-relaxed">
				Missions are the cheap XP: a casual player who clears them barely needs
				extra games. Riot doesn't publish weekly mission XP, so we use this
				week's in-game value. Later weeks usually pay more, so this errs on the
				safe side.
			</p>
		</Panel>
	);
}

const DAILY_XP = 4000;
