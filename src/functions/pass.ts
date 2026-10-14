import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import snapshot from "@/data/pass-snapshot.json";

import type { Pass } from "@/lib/types";
import { getCurrentPass, getPass, listPasses } from "@/lib/valorant-api";

const fallback = snapshot as Pass;

// Every visitor sees the same pass data (progress lives in localStorage), so
// let Vercel's CDN serve it and refresh in the background.
function cachePublicly() {
	setResponseHeaders(
		new Headers({
			"Cache-Control": "public, max-age=0, must-revalidate",
			"CDN-Cache-Control":
				"public, s-maxage=3600, stale-while-revalidate=86400",
		}),
	);
}

const covers = (pass: Pass, now: Date) => {
	const iso = now.toISOString();
	return pass.startTime <= iso && iso < pass.endTime;
};

export const fetchCurrentPass = createServerFn().handler(async () => {
	cachePublicly();
	const now = new Date();
	// The bundled snapshot is identical to the live data while its act runs,
	// and skips ~70 upstream requests on a cold start. Once a new act begins
	// it no longer covers today, so we go live automatically.
	if (covers(fallback, now)) return fallback;
	try {
		return await getCurrentPass(now);
	} catch (error) {
		console.error("valorant-api unavailable, serving snapshot", error);
		return { ...fallback, stale: true };
	}
});

export const fetchPassList = createServerFn().handler(async () => {
	cachePublicly();
	try {
		return await listPasses();
	} catch {
		return [
			{
				id: fallback.id,
				name: fallback.name,
				startTime: fallback.startTime,
				endTime: fallback.endTime,
			},
		];
	}
});

export const fetchPass = createServerFn()
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		cachePublicly();
		if (id === fallback.id) return fallback;
		return getPass(id);
	});
