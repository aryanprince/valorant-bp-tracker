import { Lock } from "lucide-react";

import { fmt } from "@/lib/format";
import type { Pass, Reward, RewardKind, Tier } from "@/lib/types";

import { cn } from "./ui";

const KIND_LABEL: Record<RewardKind, string> = {
	skin: "Weapon",
	buddy: "Buddy",
	spray: "Spray",
	card: "Card",
	title: "Title",
	flex: "Flex",
	currency: "Currency",
	radianite: "Radianite",
	other: "Reward",
};

export const kindLabel = (k: RewardKind) => KIND_LABEL[k];

export function RewardArt({
	reward,
	className,
}: {
	reward: Reward;
	className?: string;
}) {
	if (!reward.icon) {
		return (
			<div
				className={cn(
					"grid place-items-center px-2 text-center font-label font-semibold text-bone text-sm uppercase leading-tight tracking-wider",
					className,
				)}
			>
				{reward.name.replace(/ Title$/, "")}
			</div>
		);
	}
	return (
		<img
			src={reward.icon}
			alt=""
			loading="lazy"
			className={cn(
				"object-contain",
				reward.kind === "skin" && "-rotate-12 scale-110",
				className,
			)}
		/>
	);
}

type TileState = "owned" | "current" | "projected" | "locked";

/** A tier card styled after the client's battlepass reward strip. */
export function TierTile({
	tier,
	state = "locked",
	progress,
	compact,
}: {
	tier: Tier;
	state?: TileState;
	/** 0–1, only for the current tier. */
	progress?: number;
	/** Just "Tier N" under the art, for tight strips. */
	compact?: boolean;
}) {
	return (
		<div
			className={cn(
				"group relative flex w-full flex-col border bg-panel-2 transition",
				state === "current" && "border-bone ring-1 ring-bone",
				state === "owned" && "border-teal/40",
				state === "projected" && "border-gold/50",
				state === "locked" && "border-line/70",
			)}
		>
			<div
				className={cn(
					"h-1 bg-line/60",
					state === "owned" && "bg-teal/70",
					state === "projected" && "bg-gold/40",
				)}
			>
				{state === "current" && progress !== undefined && (
					<div
						className="h-full bg-bone"
						style={{ width: `${Math.min(100, progress * 100)}%` }}
					/>
				)}
			</div>
			<div
				className={cn(
					"relative aspect-square overflow-hidden",
					compact ? "p-2" : "p-3",
					tier.reward.highlighted && "bg-gradient-to-b from-gold/10",
					tier.reward.kind === "card" && "p-0",
				)}
			>
				<RewardArt
					reward={tier.reward}
					className={cn(
						"size-full",
						state === "locked" && "opacity-80",
						tier.reward.kind === "card" && "object-cover",
					)}
				/>
				{state !== "owned" && (
					<Lock
						className={cn(
							"absolute text-bone/80 drop-shadow",
							compact ? "bottom-1 left-1 size-3" : "bottom-2 left-2 size-4",
						)}
					/>
				)}
				{tier.epilogue && !compact && (
					<span className="absolute top-1.5 right-1.5 bg-gold/90 px-1 font-label font-semibold text-[10px] text-ink uppercase tracking-wider">
						Epilogue
					</span>
				)}
			</div>
			<div
				className={cn(
					"border-line/60 border-t bg-ink/40 text-center",
					compact ? "px-1 py-1" : "px-2 py-1.5",
				)}
				title={tier.reward.name}
			>
				<div
					className={cn(
						"font-label font-semibold uppercase tracking-wider",
						compact ? "text-[10px]" : "text-xs",
						state === "current" ? "text-bone" : "text-bone/80",
					)}
				>
					Tier {tier.tier}
				</div>
				{!compact && (
					<div className="truncate text-[11px] text-mist">
						{tier.reward.name}
					</div>
				)}
			</div>
		</div>
	);
}

/** Whole pass, chapter by chapter, free rewards on the right. */
export function RewardGrid({
	pass,
	ownedThrough = 0,
	currentTier,
	currentProgress,
	projectedThrough = 0,
}: {
	pass: Pass;
	ownedThrough?: number;
	currentTier?: number;
	currentProgress?: number;
	projectedThrough?: number;
}) {
	const stateOf = (t: Tier): TileState =>
		t.tier <= ownedThrough
			? "owned"
			: t.tier === currentTier
				? "current"
				: t.tier <= projectedThrough
					? "projected"
					: "locked";

	return (
		<div className="space-y-6">
			{pass.chapters.map((chapter) => {
				const xp = chapter.tiers.reduce((n, t) => n + t.xp, 0);
				return (
					<div key={chapter.number}>
						<div className="mb-2 flex items-baseline justify-between gap-3">
							<h3 className="font-label font-semibold text-bone text-sm uppercase tracking-[0.2em]">
								{chapter.epilogue ? "Epilogue" : `Chapter ${chapter.number}`}
							</h3>
							<span className="text-mist text-xs tabular-nums">
								{fmt(xp)} XP
							</span>
						</div>
						<div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
							{chapter.tiers.map((t) => (
								<TierTile
									key={t.tier}
									tier={t}
									state={stateOf(t)}
									progress={
										t.tier === currentTier ? currentProgress : undefined
									}
								/>
							))}
							{chapter.freeRewards.length > 0 && (
								<FreeRewards rewards={chapter.freeRewards} />
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}

function FreeRewards({ rewards }: { rewards: Reward[] }) {
	return (
		<div className="col-span-3 flex flex-col border border-teal/30 border-dashed bg-teal/[0.03] sm:col-span-1">
			<div className="px-2 pt-1.5 font-label font-semibold text-[10px] text-teal uppercase tracking-[0.2em]">
				Free · chapter done
			</div>
			<div className="flex flex-1 items-center justify-center gap-2 p-2 sm:flex-col">
				{rewards.map((r) => (
					<div
						key={`${r.kind}-${r.name}`}
						className="flex min-w-0 flex-1 flex-col items-center gap-1"
						title={r.name}
					>
						<RewardArt reward={r} className="size-14 max-h-14" />
						<span className="line-clamp-2 text-center text-[11px] text-mist leading-tight">
							{r.name}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
