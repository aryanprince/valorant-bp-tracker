import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";

export const cn = (...c: (string | false | null | undefined)[]) =>
	c.filter(Boolean).join(" ");

export function Panel({
	title,
	aside,
	children,
	className,
}: {
	title?: ReactNode;
	aside?: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	return (
		<section
			className={cn(
				"clip-corner border border-line/60 bg-panel/80 backdrop-blur-sm",
				className,
			)}
		>
			{title && (
				<header className="flex items-center justify-between gap-3 border-line/60 border-b bg-panel-2/70 px-5 py-3">
					<h2 className="font-label font-semibold text-bone text-sm uppercase tracking-[0.2em]">
						{title}
					</h2>
					{aside}
				</header>
			)}
			<div className="p-5">{children}</div>
		</section>
	);
}

export function Label({ children }: { children: ReactNode }) {
	return (
		<div className="mb-2 font-label font-semibold text-mist text-xs uppercase tracking-[0.2em]">
			{children}
		</div>
	);
}

export function Stepper({
	value,
	onChange,
	min = 0,
	max = 99,
	step = 1,
	label,
	size = "md",
}: {
	value: number;
	onChange: (n: number) => void;
	min?: number;
	max?: number;
	step?: number;
	label: string;
	size?: "md" | "lg";
}) {
	const clamp = (n: number) => Math.min(max, Math.max(min, n));
	const btn =
		"grid place-items-center border border-line text-mist transition hover:border-bone hover:text-bone disabled:opacity-30 disabled:hover:border-line disabled:hover:text-mist";
	return (
		<div className="flex items-stretch">
			<button
				type="button"
				aria-label={`Fewer ${label}`}
				className={cn(btn, size === "lg" ? "w-11" : "w-8")}
				disabled={value <= min}
				onClick={() => onChange(clamp(value - step))}
			>
				<Minus className="size-4" />
			</button>
			<input
				aria-label={label}
				type="number"
				inputMode="numeric"
				value={value}
				min={min}
				max={max}
				onChange={(e) => {
					const n = Number(e.target.value);
					if (!Number.isNaN(n)) onChange(clamp(n));
				}}
				className={cn(
					"w-full min-w-0 border-line border-y bg-ink/60 text-center text-bone tabular-nums outline-none focus:bg-ink",
					size === "lg"
						? "h-14 font-display text-3xl"
						: "h-8 font-label font-semibold text-lg",
				)}
			/>
			<button
				type="button"
				aria-label={`More ${label}`}
				className={cn(btn, size === "lg" ? "w-11" : "w-8")}
				disabled={value >= max}
				onClick={() => onChange(clamp(value + step))}
			>
				<Plus className="size-4" />
			</button>
		</div>
	);
}

export function Segmented<T extends string | number>({
	value,
	options,
	onChange,
	label,
}: {
	value: T;
	options: { value: T; label: ReactNode }[];
	onChange: (v: T) => void;
	label: string;
}) {
	return (
		<fieldset aria-label={label} className="flex flex-wrap gap-1">
			{options.map((o) => (
				<button
					key={String(o.value)}
					type="button"
					aria-pressed={o.value === value}
					onClick={() => onChange(o.value)}
					className={cn(
						"min-w-9 border px-3 py-1.5 font-label font-semibold text-sm uppercase tracking-wider transition",
						o.value === value
							? "border-bone bg-bone text-ink"
							: "border-line text-mist hover:border-mist hover:text-bone",
					)}
				>
					{o.label}
				</button>
			))}
		</fieldset>
	);
}

export function Toggle({
	checked,
	onChange,
	children,
	hint,
}: {
	checked: boolean;
	onChange: (v: boolean) => void;
	children: ReactNode;
	hint?: ReactNode;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			onClick={() => onChange(!checked)}
			className={cn(
				"flex w-full items-center gap-3 border px-3 py-2.5 text-left transition",
				checked ? "border-teal/60 bg-teal/5" : "border-line hover:border-mist",
			)}
		>
			<span
				className={cn(
					"grid size-5 shrink-0 rotate-45 place-items-center border transition",
					checked ? "border-teal bg-teal/20" : "border-mist",
				)}
			>
				{checked && <span className="size-2 bg-teal" />}
			</span>
			<span className="min-w-0">
				<span className="block font-label font-semibold text-bone uppercase tracking-wider">
					{children}
				</span>
				{hint && <span className="block text-mist text-xs">{hint}</span>}
			</span>
		</button>
	);
}

/** The diamond-shaped pips from the client's DAILIES / MISSIONS widgets. */
export function Pips({
	value,
	max,
	onChange,
	label,
}: {
	value: number;
	max: number;
	onChange: (n: number) => void;
	label: string;
}) {
	return (
		<fieldset className="flex items-center gap-2" aria-label={label}>
			{Array.from({ length: max }, (_, i) => {
				const n = i + 1;
				const on = n <= value;
				return (
					<button
						// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length pips
						key={i}
						type="button"
						aria-label={`${label}: ${n} of ${max}`}
						aria-pressed={on}
						onClick={() => onChange(value === n ? n - 1 : n)}
						className={cn(
							"size-6 rotate-45 border-2 transition",
							on
								? "border-teal bg-teal/80 shadow-[0_0_12px] shadow-teal/40"
								: "border-line hover:border-mist",
						)}
					/>
				);
			})}
			<span className="ml-2 font-label font-semibold text-bone tabular-nums">
				{value}/{max}
			</span>
		</fieldset>
	);
}

export function Stat({
	label,
	value,
	sub,
	tone = "bone",
}: {
	label: string;
	value: ReactNode;
	sub?: ReactNode;
	tone?: "bone" | "teal" | "red" | "gold";
}) {
	const color = {
		bone: "text-bone",
		teal: "text-teal",
		red: "text-red",
		gold: "text-gold",
	}[tone];
	return (
		<div className="border-line/60 border-l-2 pl-3">
			<div className="font-label font-semibold text-mist text-xs uppercase tracking-[0.2em]">
				{label}
			</div>
			<div className={cn("font-display text-3xl tabular-nums", color)}>
				{value}
			</div>
			{sub && <div className="text-mist text-xs">{sub}</div>}
		</div>
	);
}
