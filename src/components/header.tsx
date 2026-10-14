import { Link } from "@tanstack/react-router";

import { cn } from "./ui";

const tab =
	"relative px-1 py-5 font-label font-semibold text-sm uppercase tracking-[0.2em] text-mist transition hover:text-bone";

export function Header() {
	return (
		<header className="sticky top-0 z-20 border-line/60 border-b bg-ink/90 backdrop-blur">
			<div className="mx-auto flex max-w-6xl items-center gap-6 pr-4">
				<Link
					to="/"
					className="clip-slant flex items-center gap-2 bg-red py-3 pr-8 pl-4 transition hover:bg-red-dark sm:pl-6"
				>
					<Logo />
					<span className="font-display text-2xl text-bone uppercase leading-none tracking-wide">
						BP Tracker
					</span>
				</Link>
				<nav className="flex items-center gap-5">
					{(
						[
							["/", "Tracker"],
							["/passes", "Passes"],
						] as const
					).map(([to, label]) => (
						<Link
							key={to}
							to={to}
							activeOptions={{ exact: to === "/" }}
							className={tab}
							activeProps={{
								className: cn(
									"text-bone after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-bone",
								),
							}}
						>
							{label}
						</Link>
					))}
				</nav>
			</div>
		</header>
	);
}

function Logo() {
	return (
		<svg viewBox="0 0 32 32" className="size-6" aria-hidden="true">
			<path
				d="M16 3 29 16 16 29 3 16Z"
				fill="none"
				stroke="#ece8e1"
				strokeWidth="3"
			/>
			<path d="M16 10 22 16 16 22 10 16Z" fill="#ece8e1" />
		</svg>
	);
}
