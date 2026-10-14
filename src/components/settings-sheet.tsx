import { Settings2, X } from "lucide-react";
import { useRef } from "react";

import { fmt } from "@/lib/format";
import { DEFAULT_WEEKLY_MISSION_XP, type Settings } from "@/lib/xp";

import { Label, Segmented, Stepper, Toggle } from "./ui";

/** Everything that's set once and rarely touched, out of the main flow. */
export function SettingsSheet({
	settings: s,
	onChange,
	onClearHistory,
	checkins,
}: {
	settings: Settings;
	onChange: (patch: Partial<Settings>) => void;
	onClearHistory: () => void;
	checkins: number;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	const summary = [
		s.premium ? "Premium" : "Free pass",
		s.daysPerWeek < 7 ? `${s.daysPerWeek} days a week` : "Every day",
	].join(" · ");

	return (
		<>
			<button
				type="button"
				onClick={() => ref.current?.showModal()}
				className="group flex items-center gap-3 border border-line px-4 py-2.5 text-left transition hover:border-bone"
			>
				<Settings2 className="size-5 text-mist transition group-hover:text-bone" />
				<span>
					<span className="block font-label font-semibold text-bone text-sm uppercase tracking-wider">
						Settings
					</span>
					<span className="block text-mist text-xs">{summary}</span>
				</span>
			</button>

			<dialog
				ref={ref}
				aria-label="Settings"
				onClick={(e) => e.target === ref.current && ref.current?.close()}
				onKeyDown={(e) => e.key === "Escape" && ref.current?.close()}
				className="m-0 ml-auto h-dvh max-h-none w-full max-w-md border-line border-l bg-panel p-0 text-bone backdrop:bg-ink/80"
			>
				<div className="flex h-full flex-col">
					<header className="flex items-center justify-between border-line/60 border-b bg-panel-2 px-5 py-4">
						<h2 className="font-display text-2xl uppercase">Settings</h2>
						<button
							type="button"
							aria-label="Close settings"
							onClick={() => ref.current?.close()}
							className="grid size-9 place-items-center border border-line text-mist hover:border-bone hover:text-bone"
						>
							<X className="size-4" />
						</button>
					</header>

					<div className="flex-1 space-y-7 overflow-y-auto p-5">
						<section>
							<Label>Battlepass</Label>
							<Toggle
								checked={s.premium}
								onChange={(premium) => onChange({ premium })}
								hint="+3% match XP · “Battlepass 3% XP boost enabled”"
							>
								Premium battlepass
							</Toggle>
							<p className="mt-2 text-mist text-xs">
								Game Pass and party size live in the Today panel.
							</p>
						</section>

						<section>
							<Label>Days you play a week</Label>
							<Segmented
								label="Days per week"
								value={s.daysPerWeek}
								onChange={(daysPerWeek) => onChange({ daysPerWeek })}
								options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({
									value: n,
									label: n,
								}))}
							/>
							<p className="mt-2 text-mist text-xs">
								Missed days bank a double checkpoint for later (up to 3), which
								we count.
							</p>
						</section>

						<section className="space-y-2">
							<Label>Missions</Label>
							<Toggle
								checked={s.dailies}
								onChange={(dailies) => onChange({ dailies })}
								hint="4 × 1,000 XP a day"
							>
								I do my dailies
							</Toggle>
							<Toggle
								checked={s.weeklies}
								onChange={(weeklies) => onChange({ weeklies })}
								hint="3 a week, they stack until the act ends"
							>
								I do my weeklies
							</Toggle>
							{s.weeklies && (
								<div className="border border-line/60 p-3">
									<p className="mb-2 font-label font-semibold text-bone text-sm uppercase tracking-wider">
										XP per weekly mission
									</p>
									<p className="mb-3 text-mist text-xs">
										Hover MISSIONS in VALORANT, each one shows +XP. This act
										started at {fmt(DEFAULT_WEEKLY_MISSION_XP)}. Update it when
										a new week pays more.
									</p>
									<div className="max-w-56">
										<Stepper
											label="XP per weekly mission"
											value={s.weeklyMissionXp}
											step={100}
											max={100000}
											onChange={(weeklyMissionXp) =>
												onChange({ weeklyMissionXp })
											}
										/>
									</div>
								</div>
							)}
						</section>

						<section>
							<Label>History</Label>
							<p className="mb-3 text-mist text-xs">
								{checkins
									? `${checkins} check-in${checkins === 1 ? "" : "s"} saved in this browser for this act.`
									: "Nothing saved yet."}
							</p>
							<button
								type="button"
								disabled={!checkins}
								onClick={() => {
									if (confirm("Clear your saved progress for this act?")) {
										onClearHistory();
									}
								}}
								className="border border-red/50 px-3 py-2 font-label font-semibold text-red text-sm uppercase tracking-wider transition hover:bg-red/10 disabled:opacity-40"
							>
								Clear history
							</button>
						</section>
					</div>
				</div>
			</dialog>
		</>
	);
}
