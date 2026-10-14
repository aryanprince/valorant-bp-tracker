import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { Header } from "@/components/header";
import { cn } from "@/components/ui";
import { fetchPassList } from "@/functions/pass";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/passes/")({
	loader: () => fetchPassList(),
	head: () => ({ meta: [{ title: "Past passes | BP Tracker" }] }),
	component: Passes,
});

function Passes() {
	const passes = Route.useLoaderData();
	const now = new Date().toISOString();

	return (
		<>
			<Header />
			<main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
				<p className="font-label font-semibold text-mist text-sm uppercase tracking-[0.25em]">
					Archive
				</p>
				<h1 className="font-display text-5xl text-bone uppercase leading-none sm:text-7xl">
					Every battlepass
				</h1>
				<ul className="mt-8 divide-y divide-line/60 border border-line/60 bg-panel/80">
					{passes.map((p) => {
						const live = p.startTime <= now && now < p.endTime;
						return (
							<li key={p.id}>
								<Link
									to="/passes/$passId"
									params={{ passId: p.id }}
									className="group flex items-center gap-4 px-5 py-4 transition hover:bg-panel-2"
								>
									<span
										className={cn(
											"size-2.5 shrink-0 rotate-45",
											live ? "bg-teal" : "bg-line",
										)}
									/>
									<span className="min-w-0 flex-1">
										<span className="block truncate font-label font-semibold text-bone text-lg uppercase tracking-wider">
											{p.name}
										</span>
										<span className="text-mist text-sm">
											{fmtDate(p.startTime, { year: "numeric" })} –{" "}
											{fmtDate(p.endTime, { year: "numeric" })}
										</span>
									</span>
									{live && (
										<span className="font-label font-semibold text-teal text-xs uppercase tracking-wider">
											Live
										</span>
									)}
									<ChevronRight className="size-5 text-mist transition group-hover:translate-x-0.5 group-hover:text-bone" />
								</Link>
							</li>
						);
					})}
				</ul>
			</main>
		</>
	);
}
