import { fmt } from "@/lib/format";
import type { Pass } from "@/lib/types";
import { maxTier, type Reading, tierXp, totalXp, xpThrough } from "@/lib/xp";

import { Label, Panel, Pips, Stepper } from "./ui";

/** The four numbers you can read straight off the in-game battlepass screen. */
export function ReadingCard({
	pass,
	reading,
	isNew,
	onChange,
}: {
	pass: Pass;
	reading: Reading;
	isNew: boolean;
	onChange: (r: Reading) => void;
}) {
	const need = tierXp(pass, reading.tier);
	const set = (patch: Partial<Reading>) => {
		const next = { ...reading, ...patch };
		next.xpInTier = Math.min(
			next.xpInTier,
			Math.max(0, tierXp(pass, next.tier) - 1),
		);
		onChange(next);
	};

	return (
		<Panel title="From your screen">
			{isNew && (
				<p className="mb-5 border-red border-l-2 bg-red/5 px-3 py-2 text-bone/90 text-sm">
					Open VALORANT → <b>Battlepass</b>. Copy the tier with the progress bar
					and its XP. That's it — everything else is worked out for you.
				</p>
			)}

			<div className="grid grid-cols-2 gap-4">
				<div>
					<Label>Tier</Label>
					<Stepper
						size="lg"
						label="tier"
						value={reading.tier}
						min={2}
						max={maxTier(pass)}
						onChange={(tier) => set({ tier })}
					/>
				</div>
				<div>
					<Label>XP on this tier</Label>
					<div className="flex h-14 items-center border border-line bg-ink/60 focus-within:border-bone">
						<input
							aria-label="XP on this tier"
							type="number"
							inputMode="numeric"
							min={0}
							max={need - 1}
							value={reading.xpInTier}
							onFocus={(e) => e.target.select()}
							onChange={(e) => {
								const n = Number(e.target.value);
								if (!Number.isNaN(n)) set({ xpInTier: Math.max(0, n) });
							}}
							className="h-full w-full min-w-0 bg-transparent pl-3 font-display text-3xl text-bone tabular-nums outline-none"
						/>
						<span className="shrink-0 pr-3 font-label font-semibold text-mist">
							/ {fmt(need)}
						</span>
					</div>
				</div>
			</div>

			<div className="mt-3 h-1.5 bg-line/60">
				<div
					className="h-full bg-bone transition-[width]"
					style={{ width: `${(reading.xpInTier / Math.max(1, need)) * 100}%` }}
				/>
			</div>

			<div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
				<div>
					<Label>Dailies done today</Label>
					<Pips
						label="Daily checkpoints"
						max={4}
						value={reading.dailiesDone}
						onChange={(dailiesDone) => set({ dailiesDone })}
					/>
				</div>
				<div>
					<Label>Weekly missions done</Label>
					<Pips
						label="Weekly missions"
						max={3}
						value={reading.missionsDone}
						onChange={(missionsDone) => set({ missionsDone })}
					/>
				</div>
			</div>

			<WholePass
				pass={pass}
				xp={totalXp(pass, reading.tier, reading.xpInTier)}
			/>
		</Panel>
	);
}

/** Chapter-by-chapter fill, like the client's chapter pips. */
function WholePass({ pass, xp }: { pass: Pass; xp: number }) {
	const main = xpThrough(pass, 50);
	let before = 0;
	return (
		<div className="mt-6 border-line/60 border-t pt-5">
			<div className="mb-2 flex items-baseline justify-between">
				<Label>Whole pass</Label>
				<span className="font-label font-semibold text-bone tabular-nums">
					{((Math.min(xp, main) / main) * 100).toFixed(1)}%
					<span className="text-mist"> of tier 50</span>
				</span>
			</div>
			<div className="flex gap-1">
				{pass.chapters.map((c) => {
					const size = c.tiers.reduce((n, t) => n + t.xp, 0);
					const fill = Math.min(1, Math.max(0, (xp - before) / size));
					before += size;
					return (
						<div
							key={c.number}
							title={c.epilogue ? "Epilogue" : `Chapter ${c.number}`}
							className={
								c.epilogue
									? "h-2 flex-[1.4] bg-gold/15"
									: "h-2 flex-1 bg-line/60"
							}
						>
							<div
								className={c.epilogue ? "h-full bg-gold" : "h-full bg-teal"}
								style={{ width: `${fill * 100}%` }}
							/>
						</div>
					);
				})}
			</div>
			<p className="mt-2 text-mist text-xs tabular-nums">
				{fmt(xp)} / {fmt(main)} XP · each block is a chapter, gold is the
				epilogue
			</p>
		</div>
	);
}
