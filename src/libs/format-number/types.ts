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

/** Single entry of a custom unit scale. */
export type FormatUnitScaleEntry = {
    /** Positive multiplier applied to the value. The label wins when `|value| / factor >= 1`. */
    factor: number;
    /** Suffix rendered after the scaled value (e.g. `'KB'`). Use an empty string to suppress the suffix and the delimiter. */
    label: string;
};

/**
 * Custom unit scale for numeric formatting.
 * - `{base, labels}` — geometric progression: `labels[i]` is bound to `factor = base^i` (e.g. `{base: 1024, labels: ['B','KB','MB']}`).
 * - `FormatUnitScaleEntry[]` — arbitrary factors; required for non-linear scales (e.g. `[{factor:1,label:'s'},{factor:60,label:'min'},{factor:3600,label:'h'}]`).
 */
export type FormatUnitScale = {base: number; labels: string[]} | FormatUnitScaleEntry[];

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
     * Custom unit scale. When set, fully overrides `unit`.
     * Unit selection is always automatic: the entry with the largest `factor` such that `|value| / factor >= 1`,
     * clamped to the smallest entry for very small values.
     */
    units?: FormatUnitScale;
    /**
     * String placed between the scaled value and the unit label when `units` is set.
     * Defaults to a locale-aware space. Use `''` to render without a separator (e.g. `'1.5h'`).
     */
    unitDelimiter?: string;
}
