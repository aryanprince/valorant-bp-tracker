import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import snapshot from "@/data/pass-snapshot.json";
import type { Pass } from "@/lib/types";

// The social preview card. Not linked anywhere: open /og at a 1200×630
// viewport, screenshot it, and save as public/og.png.
export const Route = createFileRoute("/og")({
	head: () => ({
		meta: [
			{ title: "OG image | BP Tracker" },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: OgCard,
});

const pass = snapshot as Pass;
const tiers = pass.chapters.flatMap((c) => c.tiers);
const art = (n: number) => tiers.find((t) => t.tier === n)?.reward.icon ?? "";
const STRIP = [16, 30, 40, 50];

function OgCard() {
	return (
		<div className="relative h-[630px] w-[1200px] overflow-hidden bg-ink">
			{/* Client-style backdrop: diagonal hairlines and a cold glow. */}
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,#22374f_0%,#0f1923_60%)]" />
			<div className="absolute inset-0 bg-[length:420px_420px] bg-[linear-gradient(135deg,transparent_49.8%,rgb(255_255_255/0.05)_50%,transparent_50.2%),linear-gradient(45deg,transparent_49.8%,rgb(255_255_255/0.04)_50%,transparent_50.2%)]" />
			<img
				src={art(30)}
				alt=""
				className="absolute top-[30px] right-[-140px] w-[760px] -rotate-12 opacity-[0.08]"
			/>
			<div className="absolute top-0 left-0 h-full w-2 bg-red" />

			<div className="relative flex h-full flex-col px-16 pt-12 pb-10">
				<div className="clip-slant flex w-fit items-center gap-3 bg-red py-3 pr-12 pl-5">
					<svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
						<path
							d="M16 3 29 16 16 29 3 16Z"
							fill="none"
							stroke="#ece8e1"
							strokeWidth="3"
						/>
						<path d="M16 10 22 16 16 22 10 16Z" fill="#ece8e1" />
					</svg>
					<span className="font-display text-3xl text-bone uppercase tracking-wide">
						BP Tracker
					</span>
				</div>

				<div className="mt-10 flex flex-1 gap-12">
					<div className="flex w-[560px] flex-col">
						<h1 className="font-display text-[92px] text-bone uppercase leading-[0.92]">
							How many games till <span className="text-teal">tier 50?</span>
						</h1>
						<p className="mt-6 text-2xl text-bone/80 leading-snug">
							Copy four numbers off your battlepass screen. Get told exactly
							what to play. No spreadsheets, no tier-skip shame.
						</p>
					</div>

					<div className="flex flex-1 flex-col justify-center gap-4">
						<div className="clip-corner border border-line bg-panel/90">
							<div className="border-line/70 border-b bg-panel-2 px-5 py-2.5 font-label font-semibold text-bone text-sm uppercase tracking-[0.2em]">
								What to do
							</div>
							<div className="grid grid-cols-2">
								<div className="px-5 py-4">
									<p className="font-display text-7xl text-teal leading-none">
										2
									</p>
									<p className="mt-1 font-label font-semibold text-bone text-lg uppercase tracking-wider">
										games a day
									</p>
								</div>
								<div className="border-line/70 border-l px-5 py-4">
									<p className="font-display text-7xl text-bone leading-none">
										~97
									</p>
									<p className="mt-1 font-label font-semibold text-bone text-lg uppercase tracking-wider">
										games total
									</p>
								</div>
							</div>
							<p className="border-line/70 border-t px-5 py-2.5 font-label text-mist text-sm uppercase tracking-wider">
								Unrated / Comp · dailies + weeklies cleared
							</p>
						</div>

						<div className="grid grid-cols-4 gap-2">
							{STRIP.map((n, i) => (
								<div
									key={n}
									className={
										i === 0
											? "border border-bone bg-panel-2 ring-1 ring-bone"
											: "border border-line bg-panel-2"
									}
								>
									<div className="h-1 bg-line">
										{i === 0 && <div className="h-full w-2/5 bg-bone" />}
									</div>
									<div className="relative grid aspect-square place-items-center p-2">
										<img src={art(n)} alt="" className="w-full -rotate-12" />
										<Lock className="absolute bottom-1.5 left-1.5 size-3.5 text-bone/80" />
									</div>
									<div className="border-line border-t py-1 text-center font-label font-semibold text-bone text-xs uppercase tracking-wider">
										Tier {n}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="flex items-center justify-between font-label font-semibold text-mist uppercase tracking-[0.2em]">
					<div className="flex items-center gap-2">
						{Array.from({ length: 11 }, (_, i) => (
							<span
								// biome-ignore lint/suspicious/noArrayIndexKey: decorative row
								key={i}
								className={
									i === 1
										? "size-4 rotate-45 border border-bone bg-bone"
										: i === 0
											? "size-2.5 rotate-45 bg-teal"
											: i === 10
												? "size-2.5 rotate-45 border border-gold"
												: "size-2.5 rotate-45 border border-mist/70"
								}
							/>
						))}
						<span className="ml-4 text-bone">
							valorant-bp-tracker.vercel.app
						</span>
					</div>
					<span className="text-sm">
						Fan-made · not affiliated with Riot Games
					</span>
				</div>
			</div>
		</div>
	);
}
