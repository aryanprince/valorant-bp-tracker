import { fmt } from "@/lib/format";
import {
	DEFAULT_WEEKLY_MISSION_XP,
	PARTY_BOOST,
	type Settings,
} from "@/lib/xp";

import { cn, Segmented, Stepper, Toggle } from "./ui";

/**
 * Each setting as one control, so the settings sheet and the panels that
 * surface it inline are always the same thing.
 */
type Props = {
	settings: Settings;
	onChange: (patch: Partial<Settings>) => void;
};

export function PremiumToggle({ settings: s, onChange }: Props) {
	return (
		<Toggle
			checked={s.premium}
			onChange={(premium) => onChange({ premium })}
			hint="+3% · “Battlepass 3% XP boost enabled”"
		>
			Premium battlepass
		</Toggle>
	);
}

export function GamePassToggle({ settings: s, onChange }: Props) {
	return (
		<Toggle
			checked={s.gamePass}
			onChange={(gamePass) => onChange({ gamePass })}
			hint="+20% · check Rewards Programs in VALORANT's top bar"
		>
			PC Game Pass
		</Toggle>
	);
}

export function PartyPicker({ settings: s, onChange }: Props) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-2">
			<span className="font-label font-semibold text-bone uppercase tracking-wider">
				Usually queue{" "}
				<span className="text-mist">
					{s.partySize > 1
						? `+${Math.round((PARTY_BOOST[s.partySize] ?? 0) * 100)}%`
						: "solo"}
				</span>
			</span>
			<Segmented
				label="Party size"
				value={s.partySize}
				onChange={(partySize) => onChange({ partySize })}
				options={[1, 2, 3, 4, 5].map((n) => ({
					value: n,
					label: n === 1 ? "Solo" : n,
				}))}
			/>
		</div>
	);
}

export function DaysPicker({ settings: s, onChange }: Props) {
	return (
		<Segmented
			label="Days per week"
			value={s.daysPerWeek}
			onChange={(daysPerWeek) => onChange({ daysPerWeek })}
			options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: n, label: n }))}
		/>
	);
}

/** Days per week as a one-line dropdown, for panel headers. */
export function DaysSelect({ settings: s, onChange }: Props) {
	return (
		<label className="relative font-label text-mist text-xs uppercase tracking-wider">
			<span className="sr-only">Days you play a week</span>
			<select
				value={s.daysPerWeek}
				onChange={(e) => onChange({ daysPerWeek: Number(e.target.value) })}
				className="cursor-pointer appearance-none border border-line bg-ink/60 py-1 pr-6 pl-2 uppercase tracking-wider transition hover:border-mist hover:text-bone focus:border-bone focus:outline-none"
			>
				{[7, 6, 5, 4, 3, 2, 1].map((n) => (
					<option key={n} value={n}>
						{n === 7
							? "Play every day"
							: `Play ${n} day${n === 1 ? "" : "s"} a week`}
					</option>
				))}
			</select>
			<span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">
				▾
			</span>
		</label>
	);
}

export function DailiesToggle({ settings: s, onChange }: Props) {
	return (
		<Toggle
			checked={s.dailies}
			onChange={(dailies) => onChange({ dailies })}
			hint="4 × 1,000 XP a day"
		>
			I do my dailies
		</Toggle>
	);
}

export function WeekliesToggle({ settings: s, onChange }: Props) {
	return (
		<Toggle
			checked={s.weeklies}
			onChange={(weeklies) => onChange({ weeklies })}
			hint="3 a week, they stack until the act ends"
		>
			I do my weeklies
		</Toggle>
	);
}

export function WeeklyXpInput({
	settings: s,
	onChange,
	className,
}: Props & { className?: string }) {
	return (
		<div className={cn("max-w-56", className)}>
			<Stepper
				label="XP per weekly mission"
				value={s.weeklyMissionXp}
				step={100}
				max={100000}
				onChange={(weeklyMissionXp) => onChange({ weeklyMissionXp })}
			/>
		</div>
	);
}

export const WEEKLY_XP_HELP = `Hover MISSIONS in VALORANT, each one shows +XP. This act started at ${fmt(DEFAULT_WEEKLY_MISSION_XP)}. Update it when a new week pays more.`;
