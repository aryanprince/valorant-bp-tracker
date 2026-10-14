export type RewardKind =
	| "skin"
	| "buddy"
	| "spray"
	| "card"
	| "title"
	| "flex"
	| "currency"
	| "radianite"
	| "other";

export type Reward = {
	kind: RewardKind;
	name: string;
	icon: string | null;
	/** Player cards also ship a wide banner, which reads better in a hero slot. */
	wideIcon: string | null;
	amount: number;
	highlighted: boolean;
};

export type Tier = {
	tier: number;
	chapter: number;
	/** XP needed to complete this tier, as shown in-game ("1,148 / 5,000 XP"). */
	xp: number;
	epilogue: boolean;
	reward: Reward;
};

export type Chapter = {
	number: number;
	epilogue: boolean;
	tiers: Tier[];
	/** Free-track rewards, unlocked when the whole chapter is complete. */
	freeRewards: Reward[];
};

export type Pass = {
	id: string;
	name: string;
	actName: string;
	episodeName: string | null;
	startTime: string;
	endTime: string;
	premiumVP: number;
	chapters: Chapter[];
	fetchedAt: string;
	source: "live" | "snapshot";
	/** Set when no pass covers today (new act not in the API yet). */
	stale?: boolean;
};

export type PassSummary = {
	id: string;
	name: string;
	startTime: string;
	endTime: string;
};
