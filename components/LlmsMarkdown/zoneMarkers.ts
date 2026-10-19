/**
 * Zone markers of the `.md` export. `<Region>` renders every zone's variant
 * there, wrapped as `OPEN` + zone codes + `SEP` + content + `CLOSE`;
 * scripts/lib/llms/clean-md.ts turns each wrap into a labelled blockquote
 * (block) or a parenthetical (inline) once its other passes are done, so a
 * quote's `> ` prefix never hides a code fence or a callout from them.
 * Private-use characters: they occur in no guide.
 */
export const ZONE_OPEN = '\u{F0004}';
export const ZONE_SEP = '\u{F0005}';
export const ZONE_CLOSE = '\u{F0006}';

/** Commercial zones, in display order. */
export const ALL_ZONES = ['eu', 'ca', 'apac'] as const;
