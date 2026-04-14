export interface FormatOptions {
    /**
     * Number of decimal places to display.
     * Use `'auto'` to determine precision automatically based on the value magnitude.
     */
    precision?: number | 'auto';
    /** When `true`, inserts a thousands separator (e.g. `1 500 000`). */
    showRankDelimiter?: boolean;
    /**
     * BCP 47 language tag used for locale-aware formatting (e.g. `'en'`, `'ru'`).
     * Defaults to the application locale when omitted.
     */
    lang?: string;
    /** Internal rendering hint for axis label layout. Not intended for public use. */
    labelMode?: string;
}

/**
 * Plain string or a per-language dictionary of strings.
 * When a dictionary is used, the lookup chain is:
 * current `lang` → `en` → empty string.
 */
export type FormatI18nString = string | Partial<Record<string, string>>;

/** Single entry of a custom unit scale. */
export type FormatUnitScaleEntry = {
    /** Positive multiplier applied to the value. The entry wins when `|value| / factor >= 1`. */
    factor: number;
    /**
     * String appended after the scaled value (e.g. `'KB'`).
     * Use an empty string to suppress the suffix and the delimiter.
     * Pass a `{lang: string}` dictionary to localize the postfix — resolution falls back to `en`, then to empty.
     */
    postfix: FormatI18nString;
};

/**
 * Custom unit scale for numeric formatting.
 *
 * `scale` describes the unit table in one of two forms:
 * - `{base, postfixes}` — geometric progression: `postfixes[i]` is bound to `factor = base^i` (e.g. `{base: 1024, postfixes: ['B','KB','MB']}`).
 * - `FormatUnitScaleEntry[]` — arbitrary factors; required for non-linear scales (e.g. `[{factor:1,postfix:'s'},{factor:60,postfix:'min'},{factor:3600,postfix:'h'}]`).
 *
 * `delimiter` is the shared string placed between the scaled value and the
 * postfix. Defaults to a locale-aware space; pass `''` to suppress it.
 *
 * The normalized scale is cached by object identity, so for best performance
 * reuse the same `units` object across `formatNumber` calls instead of
 * creating a new inline literal on every render.
 */
export type FormatUnitScale = {
    scale: {base: number; postfixes: FormatI18nString[]} | FormatUnitScaleEntry[];
    delimiter?: string;
};

export interface FormatNumberOptions extends FormatOptions {
    /**
     * Display mode for the numeric value.
     * - `'number'` — plain number (default).
     * - `'percent'` — value is multiplied by 100 and rendered with a `%` suffix.
     *
     * Combining `'percent'` with `units` is not meaningful and should be avoided.
     */
    format?: 'number' | 'percent';
    /** Factor applied to the value before formatting. For example, `multiplier: 1000` converts seconds to milliseconds. */
    multiplier?: number;
    /** String prepended to the formatted value (e.g. `'$'`). */
    prefix?: string;
    /** String appended to the formatted value (e.g. `' USD'`). */
    postfix?: string;
    /**
     * Compact unit suffix applied to large numbers.
     * - `'auto'` — picks the most appropriate unit automatically (`k`, `m`, `b`, `t`).
     * - `'k'` — thousands (÷ 1 000).
     * - `'m'` — millions (÷ 1 000 000).
     * - `'b'` — billions (÷ 1 000 000 000).
     * - `'t'` — trillions (÷ 1 000 000 000 000).
     * - `null` — no unit suffix.
     *
     * @deprecated Use `units` for custom scales. This option is fully ignored when `units` is set.
     */
    unit?: 'auto' | 'k' | 'm' | 'b' | 't' | null;
    /**
     * Custom unit scale, or a single `FormatUnitScaleEntry` as sugar for
     * locking every value to one unit (equivalent to the legacy `unit: 'k'`).
     * When set, fully overrides `unit`.
     *
     * Unit selection is always automatic: the entry with the largest `factor`
     * such that `|value| / factor >= 1`, clamped to the smallest entry for
     * very small values.
     */
    units?: FormatUnitScale | FormatUnitScaleEntry;
}
