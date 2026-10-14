import { createFileRoute } from "@tanstack/react-router";

import { BattlepassPanel } from "@/components/battlepass-panel";
import { Header } from "@/components/header";
import { Footer, HowItWorks } from "@/components/how-it-works";
import { NextSteps, Today, XpSources } from "@/components/next-steps";
import { PaceChart } from "@/components/pace-chart";
import { SettingsSheet } from "@/components/settings-sheet";
import { cn, Panel } from "@/components/ui";
import { fetchCurrentPass } from "@/functions/pass";
import { fmtDate } from "@/lib/format";
import { useProgress } from "@/lib/use-progress";
import { actClock } from "@/lib/xp";

export const Route = createFileRoute("/")({
	loader: () => fetchCurrentPass(),
	component: Tracker,
});

function Tracker() {
	const pass = Route.useLoaderData();
	const p = useProgress(pass);
	const clock = actClock(pass, p.now);

	return (
		<>
			<Header />
			<main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:py-12">
				<section className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<p className="font-label font-semibold text-mist text-sm uppercase tracking-[0.25em]">
							{pass.stale ? "Latest battlepass" : "Current battlepass"}
						</p>
						<h1 className="font-display text-5xl text-bone uppercase leading-none sm:text-7xl">
							{pass.name}
						</h1>
						<p
							className={cn(
								"mt-2 h-7 font-label font-semibold text-lg uppercase tracking-wider transition-opacity",
								!p.ready && "opacity-0",
							)}
						>
							Ends in{" "}
							<span className="text-gold">
								{Math.ceil(clock.daysLeft)} days
							</span>
							<span className="text-mist">
								{" "}
								· {fmtDate(pass.endTime, { year: "numeric" })} · Week{" "}
								{clock.week} of {clock.weeks}
							</span>
						</p>
					</div>
					<SettingsSheet
						settings={p.settings}
						onChange={p.setSettings}
						onClearHistory={p.clearHistory}
						checkins={p.checkins.length}
					/>
				</section>

				{pass.stale && (
					<p className="border border-gold/40 bg-gold/5 px-4 py-3 text-gold text-sm">
						A new act may have started but its battlepass isn't published yet.
						This page updates by itself once it is, usually within a few hours
						of the patch.
					</p>
				)}

				{/* Saved progress only exists in the browser, so hold everything
				    that depends on it until it's loaded instead of flashing defaults. */}
				<div
					className={cn(
						"space-y-6 transition-opacity duration-300",
						p.ready ? "opacity-100" : "opacity-0",
					)}
				>
					<BattlepassPanel
						pass={pass}
						reading={p.reading}
						onChange={p.setReading}
					/>

					<div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
						<NextSteps
							req={p.req}
							settings={p.settings}
							now={p.now.getTime()}
							onMode={(mode) => p.setSettings({ mode })}
							endTime={pass.endTime}
							pace={p.pace}
							projection={p.projection}
						/>
						<Today
							req={p.req}
							settings={p.settings}
							dailiesDone={p.reading.dailiesDone}
							missionsDone={p.reading.missionsDone}
						/>
					</div>

					<XpSources req={p.req} settings={p.settings} />

					<Panel
						title="Progress over time"
						aside={
							<span className="font-label text-mist text-xs uppercase tracking-wider">
								{p.checkins.length > 1
									? `${p.checkins.length} days logged`
									: "Builds as you update"}
							</span>
						}
					>
						{p.checkins.length > 1 ? (
							<PaceChart
								start={clock.start}
								end={clock.end}
								goalXp={p.req.goalXp}
								now={p.now.getTime()}
								currentXp={p.req.currentXp}
								projectedXp={p.projection?.projectedXp ?? null}
								checkins={p.checkins}
							/>
						) : (
							<p className="text-mist text-sm">
								Each day you update your tier is saved as a check-in. Come back
								tomorrow and your progress line shows up here, next to the pace
								you need.
							</p>
						)}
					</Panel>
				</div>

				<HowItWorks />
			</main>
			<Footer fetchedAt={pass.fetchedAt} source={pass.source} />
		</>
	);
}
