import { fmtDate } from "@/lib/format";

import { Panel } from "./ui";

const FACTS: [string, string][] = [
	[
		"Tiers",
		"Tier N costs 750 × N + 500 XP (tier 2 = 2,000 … tier 50 = 38,000). 980,000 XP to tier 50, 1,162,500 with the 5 epilogue tiers at 36,500 each.",
	],
	[
		"Matches",
		"Unrated, Comp, Swiftplay & Premier: 100 XP per round played + 200 per round won. Spike Rush & TDM 1,000, Deathmatch 900, Escalation 800 (+200 for a win).",
	],
	[
		"Dailies",
		"4 checkpoints × 1,000 XP a day. Each needs 4 points: 1 per round won (Unrated/Comp/Swiftplay), 2 per Spike Rush/TDM, 0 for Deathmatch. Skipped days double a checkpoint later (up to 3).",
	],
	[
		"Weeklies",
		"3 a week, they stack up until the act ends. Biggest XP source, but Riot doesn't publish the values — we assume 23,040 each (Act V's lowest) and only count what your games can clear.",
	],
	[
		"Boosts",
		"Premium pass +3%, PC Game Pass +20%, party of 2–5 +8–20%. Match XP only — not dailies or weeklies. We assume they add up.",
	],
];

export function HowItWorks() {
	return (
		<Panel title="How the numbers work">
			<dl className="grid gap-x-8 gap-y-4 md:grid-cols-2">
				{FACTS.map(([term, text]) => (
					<div key={term}>
						<dt className="font-label font-semibold text-bone uppercase tracking-wider">
							{term}
						</dt>
						<dd className="text-mist text-sm leading-relaxed">{text}</dd>
					</div>
				))}
				<div>
					<dt className="font-label font-semibold text-bone uppercase tracking-wider">
						Sources
					</dt>
					<dd className="text-mist text-sm leading-relaxed">
						Rewards & XP per tier:{" "}
						<A href="https://valorant-api.com">valorant-api.com</A>. Mechanics:{" "}
						<A href="https://wiki.playvalorant.com/en-us/Experience">
							Riot wiki
						</A>
						,{" "}
						<A href="https://support.riotgames.com/en-us/valorant/gameplay/battlepass-faq">
							Battlepass FAQ
						</A>
						,{" "}
						<A href="https://www.riotgames.com/en/riot-game-pass-benefits">
							Game Pass perks
						</A>
						.
					</dd>
				</div>
			</dl>
		</Panel>
	);
}

function A({ href, children }: { href: string; children: string }) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noreferrer"
			className="text-bone underline decoration-line underline-offset-4 hover:decoration-bone"
		>
			{children}
		</a>
	);
}

export function Footer({
	fetchedAt,
	source,
}: {
	fetchedAt: string;
	source: "live" | "snapshot";
}) {
	return (
		<footer className="mx-auto max-w-6xl px-4 pb-10 font-label text-mist text-xs uppercase tracking-wider">
			Pass data {source === "live" ? "fetched" : "snapshot from"}{" "}
			{fmtDate(fetchedAt, { year: "numeric" })} · Fan-made, not affiliated with
			Riot Games. VALORANT is a trademark of Riot Games, Inc.
		</footer>
	);
}
