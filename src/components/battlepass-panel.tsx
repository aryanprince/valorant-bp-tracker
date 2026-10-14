import { fmt } from "@/lib/format";
import type { Pass } from "@/lib/types";
import {
	completedTier,
	maxTier,
	type Reading,
	tierAt,
	tierXp,
	totalXp,
} from "@/lib/xp";

import { RewardArt, TierTile } from "./rewards";
import { cn, Label, Pips, Stepper } from "./ui";

/**
 * Laid out like the in-game Battlepass screen, so what you type can be
 * checked against what you see: reward art, name, "1,420 / 7,250 XP",
 * the chapter strip and the DAILIES / MISSIONS widgets.
 */
export function BattlepassPanel({
	pass,
	reading,
	onChange,
}: {
	pass: Pass;
	reading: Reading;
	onChange: (r: Reading) => void;
}) {
	const tier = tierAt(pass, reading.tier);
	const need = tierXp(pass, reading.tier);
	const set = (patch: Partial<Reading>) => {
		const next = { ...reading, ...patch };
		next.xpInTier = Math.min(
			next.xpInTier,
			Math.max(0, tierXp(pass, next.tier) - 1),
		);
		onChange(next);
	};
	const chapter =
		pass.chapters.find((c) => c.tiers.some((t) => t.tier === reading.tier)) ??
		pass.chapters[0];
	const owned = completedTier(
		pass,
		totalXp(pass, reading.tier, reading.xpInTier),
	);

	return (
		<section className="clip-corner relative overflow-hidden border border-line/60 bg-panel/80">
			<header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-line/60 border-b bg-panel-2/70 px-5 py-3">
				<h2 className="font-label font-semibold text-bone text-sm uppercase tracking-[0.2em]">
					Your battlepass
				</h2>
				<p className="text-mist text-xs">
					Copy these from VALORANT → Battlepass. Everything else is worked out.
				</p>
			</header>

			<div className="grid gap-6 p-5 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-8">
				{/* The big reward card, like the centre of the in-game screen. */}
				<div className="relative mx-auto flex aspect-[4/5] w-full max-w-40 items-center justify-center overflow-hidden border border-line/70 bg-gradient-to-b from-panel-2 to-ink md:max-w-60">
					{tier && (
						<RewardArt
							reward={tier.reward}
							className={cn(
								"size-full",
								tier.reward.kind === "card" ? "object-cover" : "p-6",
							)}
						/>
					)}
					<span className="absolute top-2 left-2 bg-ink/80 px-2 py-0.5 font-label font-semibold text-bone text-xs uppercase tracking-wider">
						Tier {reading.tier}
					</span>
				</div>

				<div className="min-w-0">
					<div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
						<div className="min-w-0">
							<p className="font-label font-semibold text-mist text-xs uppercase tracking-[0.2em]">
								{tier?.epilogue ? "Epilogue reward" : "Working towards"}
							</p>
							<h3 className="truncate font-display text-3xl text-bone uppercase leading-tight sm:text-4xl">
								{tier?.reward.name ?? "Pass complete"}
							</h3>
						</div>
						<div className="flex gap-6">
							<div>
								<Label>Dailies</Label>
								<Pips
									label="Daily checkpoints done"
									max={4}
									value={reading.dailiesDone}
									onChange={(dailiesDone) => set({ dailiesDone })}
								/>
							</div>
							<div>
								<Label>Missions</Label>
								<Pips
									label="Weekly missions done"
									max={3}
									value={reading.missionsDone}
									onChange={(missionsDone) => set({ missionsDone })}
								/>
							</div>
						</div>
					</div>

					<div className="mt-5 grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] gap-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
						<div>
							<Label>Tier</Label>
							<Stepper
								size="lg"
								label="Tier"
								value={reading.tier}
								min={2}
								max={maxTier(pass)}
								onChange={(n) => set({ tier: n })}
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
									className="h-full w-full min-w-0 bg-transparent pl-3 font-display text-2xl text-bone tabular-nums outline-none sm:text-3xl"
								/>
								<span className="shrink-0 pr-3 font-label font-semibold text-mist sm:text-lg">
									/ {fmt(need)}
									<span className="hidden sm:inline"> XP</span>
								</span>
							</div>
						</div>
					</div>
					<div className="mt-3 h-1.5 bg-line/60">
						<div
							className="h-full bg-bone transition-[width]"
							style={{
								width: `${(reading.xpInTier / Math.max(1, need)) * 100}%`,
							}}
						/>
					</div>

					{chapter && (
						<div className="mt-6">
							<div className="mb-2 flex items-baseline justify-between gap-3">
								<Label>
									{chapter.epilogue ? "Epilogue" : `Chapter ${chapter.number}`}
								</Label>
								<ChapterDiamonds
									pass={pass}
									current={chapter.number}
									owned={owned}
								/>
							</div>
							<div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6">
								{chapter.tiers.map((t) => (
									<TierTile
										key={t.tier}
										tier={t}
										compact
										state={
											t.tier <= owned
												? "owned"
												: t.tier === reading.tier
													? "current"
													: "locked"
										}
										progress={
											t.tier === reading.tier
												? reading.xpInTier / Math.max(1, need)
												: undefined
										}
									/>
								))}
								{chapter.freeRewards[0] && (
									<div
										className="hidden flex-col border border-teal/30 border-dashed bg-teal/[0.03] sm:flex"
										title={chapter.freeRewards.map((r) => r.name).join(", ")}
									>
										<div className="h-1" />
										<div className="flex aspect-square items-center justify-center p-2">
											<RewardArt
												reward={chapter.freeRewards[0]}
												className="size-full"
											/>
										</div>
										<div className="border-teal/20 border-t px-1 py-1 text-center font-label font-semibold text-[10px] text-teal uppercase tracking-wider">
											Free
										</div>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</section>
	);
}

/** The ◇ 2 ◆ ◆ … ★ chapter row from the bottom of the in-game screen. */
function ChapterDiamonds({
	pass,
	current,
	owned,
}: {
	pass: Pass;
	current: number;
	owned: number;
}) {
	return (
		<ol className="flex items-center gap-1.5" aria-label="Chapters">
			{pass.chapters.map((c) => {
				const last = c.tiers[c.tiers.length - 1]?.tier ?? 0;
				const done = owned >= last;
				const here = c.number === current;
				return (
					<li
						key={c.number}
						title={c.epilogue ? "Epilogue" : `Chapter ${c.number}`}
						className={cn(
							"rotate-45 border transition",
							here ? "size-3.5 border-bone bg-bone" : "size-2",
							!here && done && "border-teal bg-teal",
							!here && !done && "border-mist/60",
							c.epilogue && !here && !done && "border-gold/70",
						)}
					/>
				);
			})}
		</ol>
	);
}
