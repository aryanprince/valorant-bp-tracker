const num = new Intl.NumberFormat("en-US");
const compact = new Intl.NumberFormat("en-US", {
	notation: "compact",
	maximumFractionDigits: 1,
});

export const fmt = (n: number) => num.format(Math.round(n));
export const fmtCompact = (n: number) => compact.format(Math.round(n));

export const fmtDate = (
	t: number | string,
	opts?: Intl.DateTimeFormatOptions,
) =>
	new Date(t).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		...opts,
	});

export const plural = (n: number, word: string, many = `${word}s`) =>
	`${fmt(n)} ${n === 1 ? word : many}`;

/** "1.5" games reads oddly; round up to something a human would do. */
export const fmtGames = (g: number) =>
	g % 1 === 0 ? String(g) : `${Math.floor(g)}–${Math.ceil(g)}`;
