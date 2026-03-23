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

export interface FormatNumberOptions extends FormatOptions {
    /**
     * Display mode for the numeric value.
     * - `'number'` — plain number (default).
     * - `'percent'` — value is multiplied by 100 and rendered with a `%` suffix.
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
     */
    unit?: 'auto' | 'k' | 'm' | 'b' | 't' | null;
}
