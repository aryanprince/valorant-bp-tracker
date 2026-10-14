import { createFileRoute } from "@tanstack/react-router";

import { Header } from "@/components/header";
import { RewardGrid } from "@/components/rewards";
import { cn, Panel } from "@/components/ui";
import { fetchCurrentPass } from "@/functions/pass";
import { fmt } from "@/lib/format";
import { useProgress } from "@/lib/use-progress";
import { completedTier, tierXp } from "@/lib/xp";

export const Route = createFileRoute("/rewards")({
	loader: () => fetchCurrentPass(),
	head: () => ({ meta: [{ title: "Rewards | BP Tracker" }] }),
	component: Rewards,
});

function Rewards() {
	const pass = Route.useLoaderData();
	const p = useProgress(pass);
	const owned = completedTier(pass, p.req.currentXp);

	return (
		<>
			<Header />
			<main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:py-12">
				<div>
					<p className="font-label font-semibold text-mist text-sm uppercase tracking-[0.25em]">
						Rewards
					</p>
					<h1 className="font-display text-5xl text-bone uppercase leading-none sm:text-7xl">
						{pass.name}
					</h1>
					<p
						className={cn(
							"mt-2 h-7 font-label font-semibold text-lg text-mist uppercase tracking-wider transition-opacity",
							!p.ready && "opacity-0",
						)}
					>
						<span className="text-teal">{owned} unlocked</span> ·{" "}
						{fmt(p.req.currentXp)} XP earned
					</p>
				</div>
				<Panel
					title="Every tier"
					aside={
						<span className="flex gap-4 font-label text-xs uppercase tracking-wider">
							<span className="text-teal">◆ Unlocked</span>
							{p.projection && (
								<span className="text-gold">◆ By act end at your pace</span>
							)}
						</span>
					}
				>
					<div
						className={cn(
							"transition-opacity duration-300",
							p.ready ? "opacity-100" : "opacity-0",
						)}
					>
						<RewardGrid
							pass={pass}
							ownedThrough={owned}
							currentTier={p.reading.tier}
							currentProgress={
								p.reading.xpInTier / Math.max(1, tierXp(pass, p.reading.tier))
							}
							projectedThrough={p.projection?.projectedTier ?? 0}
						/>
					</div>
				</Panel>
			</main>
		</>
	);
}
