/**
 * Base formatting options shared across all formatters (number, bytes, duration).
 *
 * @example
 * // Fixed precision
 * formatNumber(1234.5678, { precision: 2 }); // "1,234.57"
 *
 * @example
 * // Auto precision — rounds to 2 decimal places for values > 1, to 4 for values < 1
 * formatNumber(0.00123, { precision: 'auto' }); // "0.0012"
 *
 * @example
 * // Disable thousands separator
 * formatNumber(1234567, { showRankDelimiter: false }); // "1234567"
 *
 * @example
 * // Locale-aware formatting
 * formatNumber(1234.5, { lang: 'ru' }); // "1 234,5"
 */
export interface FormatOptions {
    /**
     * Number of decimal places.
     * - `number` — fixed decimal places (e.g. `2` → `"1,234.57"`)
     * - `'auto'` — trims trailing zeros; uses 2 decimals for |value| > 1, 4 for |value| ≤ 1
     */
    precision?: number | 'auto';
    /**
     * Whether to insert a thousands separator (e.g. `1,000`).
     * @default true
     */
    showRankDelimiter?: boolean;
    /**
     * [BCP 47](https://www.rfc-editor.org/info/bcp47) language tag used for locale-specific number formatting.
     * @example 'en', 'ru', 'de'
     */
    lang?: string;
    /**
     * When set to `'percent'`, appends a `%` sign without multiplying the value by 100.
     * Useful for values already expressed as a percentage (e.g. `0.75` → `"0.75%"`).
     * For multiplying by 100, use `FormatNumberOptions.format = 'percent'` instead.
     */
    labelMode?: string;
}

/**
 * Options for `formatNumber` — extends {@link FormatOptions} with numeric transformations.
 *
 * @example
 * // Compact notation with automatic unit selection
 * formatNumber(1_500_000, { unit: 'auto' }); // "1.5M"
 *
 * @example
 * // Force kilos
 * formatNumber(2500, { unit: 'k', precision: 1 }); // "2.5K"
 *
 * @example
 * // Percentage: multiply by 100 and append %
 * formatNumber(0.753, { format: 'percent', precision: 1 }); // "75.3%"
 *
 * @example
 * // Prefix / postfix
 * formatNumber(42, { prefix: '$', postfix: ' USD' }); // "$42 USD"
 *
 * @example
 * // Custom multiplier
 * formatNumber(5, { multiplier: 2 }); // "10"
 */
export interface FormatNumberOptions extends FormatOptions {
    /**
     * Output format.
     * - `'number'` (default) — plain numeric string
     * - `'percent'` — multiplies the value by 100 and appends `%`
     * @default 'number'
     */
    format?: 'number' | 'percent';
    /**
     * Multiplies the value before formatting.
     * @default 1
     * @example
     * formatNumber(0.5, { multiplier: 200 }); // "100"
     */
    multiplier?: number;
    /**
     * String prepended to the formatted result.
     * @example '$'
     */
    prefix?: string;
    /**
     * String appended to the formatted result.
     * @example ' USD'
     */
    postfix?: string;
    /**
     * Compact unit suffix applied to the value.
     * - `'auto'` — picks the best unit based on magnitude (k / m / b / t)
     * - `'k'` | `'m'` | `'b'` | `'t'` — forces a specific unit
     * - `null` — disables unit formatting (raw number)
     * @example
     * formatNumber(2_000_000, { unit: 'm' }); // "2M"
     */
    unit?: 'auto' | 'k' | 'm' | 'b' | 't' | null;
}
