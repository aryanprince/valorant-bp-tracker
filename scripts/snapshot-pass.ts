// Refreshes the bundled fallback pass: `bun scripts/snapshot-pass.ts`.
// The site reads valorant-api.com live; this is only used if that's down.
import { getCurrentPass } from "../src/lib/valorant-api";

const pass = await getCurrentPass();
await Bun.write(
	new URL("../src/data/pass-snapshot.json", import.meta.url),
	`${JSON.stringify({ ...pass, source: "snapshot" }, null, "\t")}\n`,
);
console.log(
	`Saved ${pass.name} (${pass.chapters.flatMap((c) => c.tiers).length} tiers)`,
);
