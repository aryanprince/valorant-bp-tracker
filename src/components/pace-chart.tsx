import { useEffect, useRef, useState } from "react";

import { fmtCompact, fmtDate } from "@/lib/format";
import type { Checkin } from "@/lib/xp";

const H = 260;
const PAD = { top: 16, right: 16, bottom: 28, left: 48 };

export function PaceChart({
	start,
	end,
	goalXp,
	now,
	currentXp,
	projectedXp,
	checkins,
}: {
	start: number;
	end: number;
	goalXp: number;
	now: number;
	currentXp: number;
	projectedXp: number;
	checkins: Checkin[];
}) {
	// Draw at the real pixel width so labels stay readable on phones.
	const ref = useRef<HTMLElement>(null);
	const [W, setW] = useState(720);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const ro = new ResizeObserver(([e]) => e && setW(e.contentRect.width));
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	const top = Math.max(goalXp, projectedXp, currentXp) * 1.05;
	const x = (t: number) =>
		PAD.left + ((t - start) / (end - start)) * (W - PAD.left - PAD.right);
	const y = (xp: number) =>
		H - PAD.bottom - (xp / top) * (H - PAD.top - PAD.bottom);

	const points = [...checkins.map((c) => [c.at, c.xp] as const)];
	const last = points[points.length - 1];
	if (!last || Math.abs(last[0] - now) > 60_000) points.push([now, currentXp]);

	const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * goalXp);
	const xTicks = Array.from(
		{ length: 5 },
		(_, i) => start + ((end - start) * i) / 4,
	);
	const nowClamped = Math.min(end, Math.max(start, now));
	const ahead = projectedXp >= goalXp;

	return (
		<figure ref={ref}>
			<svg
				viewBox={`0 0 ${W} ${H}`}
				width={W}
				height={H}
				className="block"
				role="img"
				aria-label="XP over the act compared with the pace needed to finish"
			>
				{yTicks.map((v) => (
					<g key={v}>
						<line
							x1={PAD.left}
							x2={W - PAD.right}
							y1={y(v)}
							y2={y(v)}
							stroke="#2b3a4b"
							strokeDasharray={v === goalXp ? undefined : "2 4"}
						/>
						<text
							x={PAD.left - 8}
							y={y(v)}
							dy="0.32em"
							textAnchor="end"
							className="fill-mist font-label text-[11px]"
						>
							{fmtCompact(v)}
						</text>
					</g>
				))}
				{xTicks.map((t, i) => (
					<text
						key={t}
						x={x(t)}
						y={H - 8}
						textAnchor={
							i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"
						}
						className="fill-mist font-label text-[11px]"
					>
						{fmtDate(t)}
					</text>
				))}

				{/* Finish line: the straight-line pace that lands on the goal exactly at the end. */}
				<line
					x1={x(start)}
					y1={y(0)}
					x2={x(end)}
					y2={y(goalXp)}
					stroke="#8b978f"
					strokeWidth={1.5}
					strokeDasharray="6 6"
				/>
				<text
					x={x(end) - 4}
					y={y(goalXp) - 6}
					textAnchor="end"
					className="fill-bone font-label font-semibold text-[11px] uppercase tracking-widest"
				>
					Goal
				</text>

				{/* Today */}
				<line
					x1={x(nowClamped)}
					x2={x(nowClamped)}
					y1={PAD.top}
					y2={H - PAD.bottom}
					stroke="#ece8e1"
					strokeOpacity={0.2}
				/>

				{/* Projection to the end of the act */}
				<line
					x1={x(nowClamped)}
					y1={y(currentXp)}
					x2={x(end)}
					y2={y(projectedXp)}
					stroke={ahead ? "#e8c26a" : "#ff4655"}
					strokeWidth={2}
					strokeDasharray="3 5"
					strokeLinecap="round"
				/>
				<circle
					cx={x(end)}
					cy={y(projectedXp)}
					r={4}
					fill={ahead ? "#e8c26a" : "#ff4655"}
				/>

				{/* What actually happened */}
				<polyline
					points={points.map(([t, v]) => `${x(t)},${y(v)}`).join(" ")}
					fill="none"
					stroke="#17e5b0"
					strokeWidth={2.5}
					strokeLinejoin="round"
				/>
				{points.map(([t, v]) => (
					<rect
						key={t}
						x={x(t) - 4}
						y={y(v) - 4}
						width={8}
						height={8}
						transform={`rotate(45 ${x(t)} ${y(v)})`}
						fill="#0f1923"
						stroke="#17e5b0"
						strokeWidth={2}
					/>
				))}
			</svg>
			<figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-label text-mist text-xs uppercase tracking-wider">
				<Key color="#17e5b0">Your progress</Key>
				<Key color={ahead ? "#e8c26a" : "#ff4655"} dashed>
					Where you're headed
				</Key>
				<Key color="#8b978f" dashed>
					Pace to finish on time
				</Key>
			</figcaption>
		</figure>
	);
}

function Key({
	color,
	dashed,
	children,
}: {
	color: string;
	dashed?: boolean;
	children: string;
}) {
	return (
		<span className="flex items-center gap-2">
			<svg width="18" height="4" aria-hidden="true">
				<line
					x1="0"
					x2="18"
					y1="2"
					y2="2"
					stroke={color}
					strokeWidth="2.5"
					strokeDasharray={dashed ? "4 3" : undefined}
				/>
			</svg>
			{children}
		</span>
	);
}
