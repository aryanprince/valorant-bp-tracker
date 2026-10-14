import { useState } from "react";

import { fmt } from "@/lib/format";
import {
	DEFAULT_WEEKLY_MISSION_XP,
	type Forecast,
	MODE_IDS,
	MODES,
	type Plan,
	playDay,
} from "@/lib/xp";

import { Label, Panel, Segmented, Stepper, Toggle } from "./ui";

export function PlanCard({
	plan,
	onChange,
	forecast,
}: {
	plan: Plan;
	onChange: (patch: Partial<Plan>) => void;
	forecast: Forecast | null;
}) {
	const [open, setOpen] = useState(false);
	const day = playDay(plan);

	return (
		<Panel
			title="How you play"
			aside={
				<span className="font-label text-mist text-xs uppercase tracking-wider">
					Saved in this browser
				</span>
			}
		>
			<div className="grid gap-8 lg:grid-cols-2">
				<div>
					<Label>Games on a typical day</Label>
					<div className="space-y-2">
						{MODE_IDS.map((id) => (
							<div
								key={id}
								className="grid grid-cols-[1fr_8.5rem] items-center gap-3"
							>
								<div>
									<div className="font-label font-semibold text-bone uppercase tracking-wider">
										{MODES[id].label}
									</div>
									<div className="text-mist text-xs">{MODES[id].hint}</div>
								</div>
								<Stepper
									label={`${MODES[id].label} games`}
									value={plan.games[id]}
									max={20}
									onChange={(n) =>
										onChange({ games: { ...plan.games, [id]: n } })
									}
								/>
							</div>
						))}
					</div>
					<p className="mt-3 text-mist text-xs">
						A day like that ≈ {fmt(day.match)} match XP + {day.checkpoints}/4
						dailies ({fmt(day.dailies)} XP).
					</p>

					<div className="mt-6">
						<Label>Days you play per week</Label>
						<Segmented
							label="Days per week"
							value={plan.daysPerWeek}
							onChange={(daysPerWeek) => onChange({ daysPerWeek })}
							options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({
								value: n,
								label: n,
							}))}
						/>
					</div>
				</div>

				<div className="space-y-6">
					<div>
						<Label>Goal</Label>
						<Segmented
							label="Goal tier"
							value={plan.goalTier}
							onChange={(goalTier) => onChange({ goalTier })}
							options={[
								{ value: 50, label: "Tier 50" },
								{ value: 55, label: "Tier 55 · Epilogue" },
							]}
						/>
					</div>

					<div>
						<Label>XP boosts (match XP only)</Label>
						<div className="grid gap-2 sm:grid-cols-2">
							<Toggle
								checked={plan.premium}
								onChange={(premium) => onChange({ premium })}
								hint="+3% · comes with the paid pass"
							>
								Premium pass
							</Toggle>
							<Toggle
								checked={plan.gamePass}
								onChange={(gamePass) => onChange({ gamePass })}
								hint="+20% · PC Game Pass perk"
							>
								Xbox Game Pass
							</Toggle>
						</div>
						<div className="mt-3 flex flex-wrap items-center gap-3">
							<span className="font-label text-mist text-sm uppercase tracking-wider">
								Usual party
							</span>
							<Segmented
								label="Party size"
								value={plan.partySize}
								onChange={(partySize) => onChange({ partySize })}
								options={[
									{ value: 1, label: "Solo" },
									{ value: 2, label: "2 · +8%" },
									{ value: 3, label: "3 · +12%" },
									{ value: 4, label: "4 · +16%" },
									{ value: 5, label: "5 · +20%" },
								]}
							/>
						</div>
					</div>

					<div>
						<Label>Weekly missions</Label>
						<Toggle
							checked={plan.weeklies}
							onChange={(weeklies) => onChange({ weeklies })}
							hint="The biggest XP source. Counted only as far as your games can clear them."
						>
							I do my weeklies
						</Toggle>
						<button
							type="button"
							onClick={() => setOpen(!open)}
							className="mt-2 font-label text-mist text-xs uppercase tracking-wider underline-offset-4 hover:text-bone hover:underline"
						>
							{open ? "Hide" : "Fine-tune"} mission XP
						</button>
						{open && (
							<div className="mt-3 border border-line/60 p-3">
								<p className="mb-3 text-mist text-xs">
									Riot doesn't publish these. Check the Missions tab in-game and
									enter what one weekly mission is worth this week (we assume{" "}
									{fmt(DEFAULT_WEEKLY_MISSION_XP)} — last act's lowest).
								</p>
								<div className="max-w-56">
									<Stepper
										label="XP per weekly mission"
										value={plan.weeklyMissionXp}
										step={500}
										max={100000}
										onChange={(weeklyMissionXp) =>
											onChange({ weeklyMissionXp })
										}
									/>
								</div>
								{forecast && (
									<p className="mt-2 text-mist text-xs">
										≈ {fmt(forecast.weekliesLeft)} XP from weeklies over the
										rest of the act with your schedule.
									</p>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</Panel>
	);
}
