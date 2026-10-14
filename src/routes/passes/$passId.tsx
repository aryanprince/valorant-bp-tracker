import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Header } from "@/components/header";
import { RewardGrid } from "@/components/rewards";
import { Panel } from "@/components/ui";
import { fetchPass } from "@/functions/pass";
import { fmt, fmtDate } from "@/lib/format";
import { xpThrough } from "@/lib/xp";

export const Route = createFileRoute("/passes/$passId")({
	loader: async ({ params }) => {
		const pass = await fetchPass({ data: params.passId });
		if (!pass) throw notFound();
		return pass;
	},
	head: ({ loaderData }) => ({
		meta: [{ title: `${loaderData?.name ?? "Battlepass"} — BP Tracker` }],
	}),
	pendingComponent: () => (
		<>
			<Header />
			<main className="mx-auto max-w-6xl px-4 py-12 font-label text-mist uppercase tracking-[0.2em]">
				Loading rewards…
			</main>
		</>
	),
	notFoundComponent: () => (
		<>
			<Header />
			<main className="mx-auto max-w-6xl px-4 py-12 text-mist">
				No battlepass with that id.{" "}
				<Link to="/passes" className="text-bone underline">
					See all passes
				</Link>
			</main>
		</>
	),
	component: PassPage,
});

function PassPage() {
	const pass = Route.useLoaderData();
	const tiers = pass.chapters.flatMap((c) => c.tiers);
	const main = tiers.filter((t) => !t.epilogue).length;

	return (
		<>
			<Header />
			<main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:py-12">
				<Link
					to="/passes"
					className="inline-flex items-center gap-2 font-label font-semibold text-mist text-sm uppercase tracking-[0.2em] hover:text-bone"
				>
					<ArrowLeft className="size-4" /> All passes
				</Link>
				<div>
					<h1 className="font-display text-5xl text-bone uppercase leading-none sm:text-7xl">
						{pass.name}
					</h1>
					<p className="mt-2 font-label font-semibold text-lg text-mist uppercase tracking-wider">
						{fmtDate(pass.startTime, { year: "numeric" })} –{" "}
						{fmtDate(pass.endTime, { year: "numeric" })} · {main} tiers ·{" "}
						{fmt(xpThrough(pass, main))} XP · {fmt(pass.premiumVP)} VP
					</p>
				</div>
				<Panel title="Rewards">
					<RewardGrid pass={pass} />
				</Panel>
			</main>
		</>
	);
}
