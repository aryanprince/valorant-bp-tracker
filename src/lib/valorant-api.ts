// Battlepass data from valorant-api.com, the community API that mirrors the
// game files and updates within hours of every patch. Nothing in here is
// hardcoded per act: the current pass is whichever Season contract belongs to
// the act whose window contains "now".

import type { Pass, PassSummary, Reward, RewardKind } from "./types";

const API = "https://valorant-api.com/v1";

/** Riot's tier skip price. Not exposed by the API (vpCost is always 0). */
export const VP_PER_TIER = 300;
/** Radianite rewards come in lots of 10, but the API reports amount = 1. */
const RADIANITE_PER_REWARD = 10;
const RADIANITE_UUID = "e59aa87c-4cbf-517a-5983-6e81511be9b7";

type ApiSeason = {
	uuid: string;
	displayName: string;
	type: string | null;
	startTime: string;
	endTime: string;
	parentUuid: string | null;
};

type ApiReward = {
	type: string;
	uuid: string;
	amount: number;
	isHighlighted: boolean;
};

type ApiContract = {
	uuid: string;
	displayName: string;
	displayIcon: string | null;
	content: {
		relationType: string | null;
		relationUuid: string | null;
		premiumVPCost: number;
		chapters: {
			isEpilogue: boolean;
			levels: { xp: number; reward: ApiReward }[];
			freeRewards: ApiReward[] | null;
		}[];
	};
};

async function get<T>(path: string): Promise<T> {
	const res = await fetch(`${API}${path}`);
	if (!res.ok) throw new Error(`valorant-api ${path} → ${res.status}`);
	const body = (await res.json()) as { data: T };
	return body.data;
}

/** Buddy level names are internal codenames, so map level → parent buddy. */
let buddyNames: Promise<Map<string, string>> | undefined;
function getBuddyNames() {
	buddyNames ??= get<{ displayName: string; levels: { uuid: string }[] }[]>(
		"/buddies",
	).then(
		(buddies) =>
			new Map(
				buddies.flatMap((b) => b.levels.map((l) => [l.uuid, b.displayName])),
			),
	);
	buddyNames.catch(() => {
		buddyNames = undefined;
	});
	return buddyNames;
}

const KIND: Record<string, { kind: RewardKind; path: string }> = {
	EquippableSkinLevel: { kind: "skin", path: "/weapons/skinlevels" },
	EquippableCharmLevel: { kind: "buddy", path: "/buddies/levels" },
	Spray: { kind: "spray", path: "/sprays" },
	PlayerCard: { kind: "card", path: "/playercards" },
	Title: { kind: "title", path: "/playertitles" },
	Totem: { kind: "flex", path: "/flex" },
	Currency: { kind: "currency", path: "/currencies" },
};

async function resolveReward(r: ApiReward): Promise<Reward> {
	const meta = KIND[r.type];
	const base = {
		kind: meta?.kind ?? ("other" as const),
		amount: r.amount,
		highlighted: r.isHighlighted,
	};
	if (!meta) return { ...base, name: r.type, icon: null, wideIcon: null };

	if (r.uuid === RADIANITE_UUID) {
		return {
			...base,
			kind: "radianite",
			name: `${r.amount * RADIANITE_PER_REWARD} Radianite`,
			amount: r.amount * RADIANITE_PER_REWARD,
			icon: "https://media.valorant-api.com/currencies/e59aa87c-4cbf-517a-5983-6e81511be9b7/displayicon.png",
			wideIcon: null,
		};
	}

	try {
		const item = await get<{
			displayName: string;
			titleText?: string | null;
			displayIcon?: string | null;
			fullTransparentIcon?: string | null;
			wideArt?: string | null;
		}>(`${meta.path}/${r.uuid}`);
		let name = item.displayName;
		if (meta.kind === "buddy") {
			name = (await getBuddyNames()).get(r.uuid) ?? name;
		} else if (meta.kind === "title" && item.titleText) {
			name = `"${item.titleText}" Title`;
		}
		return {
			...base,
			name,
			icon: item.fullTransparentIcon ?? item.displayIcon ?? null,
			wideIcon: item.wideArt ?? null,
		};
	} catch {
		return { ...base, name: r.type, icon: null, wideIcon: null };
	}
}

async function buildPass(
	contract: ApiContract,
	season: ApiSeason,
	parent: ApiSeason | undefined,
): Promise<Pass> {
	let tierNumber = 0;
	const chapters = await Promise.all(
		contract.content.chapters.map(async (chapter, ci) => {
			const tiers = await Promise.all(
				chapter.levels.map(async (level) => ({
					tier: 0,
					chapter: ci + 1,
					xp: level.xp,
					epilogue: chapter.isEpilogue,
					reward: await resolveReward(level.reward),
				})),
			);
			return {
				number: ci + 1,
				epilogue: chapter.isEpilogue,
				tiers,
				freeRewards: await Promise.all(
					(chapter.freeRewards ?? []).map(resolveReward),
				),
			};
		}),
	);
	for (const chapter of chapters) {
		for (const tier of chapter.tiers) tier.tier = ++tierNumber;
	}

	return {
		id: contract.uuid,
		name: contract.displayName,
		actName: season.displayName,
		episodeName: parent?.displayName ?? null,
		startTime: season.startTime,
		endTime: season.endTime,
		premiumVP: contract.content.premiumVPCost,
		chapters,
		fetchedAt: new Date().toISOString(),
		source: "live",
	};
}

type Catalog = {
	seasons: ApiSeason[];
	passes: { contract: ApiContract; season: ApiSeason }[];
};

async function loadCatalog(): Promise<Catalog> {
	const [seasons, contracts] = await Promise.all([
		get<ApiSeason[]>("/seasons"),
		get<ApiContract[]>("/contracts"),
	]);
	const byUuid = new Map(seasons.map((s) => [s.uuid, s]));
	const passes = contracts
		.filter((c) => c.content.relationType === "Season")
		.flatMap((contract) => {
			const season = byUuid.get(contract.content.relationUuid ?? "");
			return season ? [{ contract, season }] : [];
		})
		.sort((a, b) => b.season.startTime.localeCompare(a.season.startTime));
	return { seasons, passes };
}

// Serverless instances are short-lived, but a warm one shouldn't refetch the
// whole catalog per request. valorant-api itself caches for 4 hours.
const TTL = 6 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; value: Promise<unknown> }>();
function memo<T>(key: string, load: () => Promise<T>): Promise<T> {
	const hit = cache.get(key);
	if (hit && Date.now() - hit.at < TTL) return hit.value as Promise<T>;
	const value = load();
	cache.set(key, { at: Date.now(), value });
	value.catch(() => cache.delete(key));
	return value;
}

const catalog = () => memo("catalog", loadCatalog);

export async function listPasses(): Promise<PassSummary[]> {
	const { passes } = await catalog();
	return passes.map(({ contract, season }) => ({
		id: contract.uuid,
		name: contract.displayName,
		startTime: season.startTime,
		endTime: season.endTime,
	}));
}

/** The pass for the act running at `now`, or the newest one if the API hasn't caught up yet. */
export async function getCurrentPass(now = new Date()): Promise<Pass> {
	const { seasons, passes } = await catalog();
	const iso = now.toISOString();
	const live = passes.find(
		(p) => p.season.startTime <= iso && iso < p.season.endTime,
	);
	const entry = live ?? passes[0];
	if (!entry) throw new Error("No battlepass contracts found");
	const parent = seasons.find((s) => s.uuid === entry.season.parentUuid);
	const pass = await memo(`pass:${entry.contract.uuid}`, () =>
		buildPass(entry.contract, entry.season, parent),
	);
	return live ? pass : { ...pass, stale: true };
}

export async function getPass(id: string): Promise<Pass | null> {
	const { seasons, passes } = await catalog();
	const entry = passes.find((p) => p.contract.uuid === id);
	if (!entry) return null;
	const parent = seasons.find((s) => s.uuid === entry.season.parentUuid);
	return memo(`pass:${id}`, () =>
		buildPass(entry.contract, entry.season, parent),
	);
}
