import type {FormatUnitScale} from './types';

/**
 * Byte scale with binary base (`1024`) and localized postfixes.
 *
 * @example
 * ```ts
 * tooltip: {
 *   valueFormat: {type: 'number', units: FORMAT_UNITS_BYTES, precision: 1},
 * }
 * ```
 */
export const FORMAT_UNITS_BYTES: FormatUnitScale = {
    scale: {
        base: 1024,
        postfixes: [
            {en: 'B', ru: 'Б'},
            {en: 'KB', ru: 'КБ'},
            {en: 'MB', ru: 'МБ'},
            {en: 'GB', ru: 'ГБ'},
            {en: 'TB', ru: 'ТБ'},
        ],
    },
};

/**
 * Short number scale with decimal base (`1000`). Renders large numbers
 * compactly as `K/M/B/T`. Postfixes are plain Latin letters and stay the
 * same regardless of language. The first entry has an empty postfix, so
 * values below `1000` render as plain numbers without a delimiter.
 *
 * @example
 * ```ts
 * tooltip: {
 *   valueFormat: {type: 'number', units: FORMAT_UNITS_NUMBERS, precision: 1},
 * }
 * // 300       → "300"
 * // 1_500     → "1.5 K"
 * // 1_500_000 → "1.5 M"
 * ```
 */
export const FORMAT_UNITS_NUMBERS: FormatUnitScale = {
    scale: {
        base: 1000,
        postfixes: ['', 'K', 'M', 'B', 'T'],
    },
};

/**
 * Bit scale with decimal base (`1000`) and localized postfixes.
 *
 * @example
 * ```ts
 * tooltip: {
 *   valueFormat: {type: 'number', units: FORMAT_UNITS_BITS, precision: 1},
 * }
 * ```
 */
export const FORMAT_UNITS_BITS: FormatUnitScale = {
    scale: {
        base: 1000,
        postfixes: [
            {en: 'bit', ru: 'бит'},
            {en: 'Kbit', ru: 'Кбит'},
            {en: 'Mbit', ru: 'Мбит'},
            {en: 'Gbit', ru: 'Гбит'},
            {en: 'Tbit', ru: 'Тбит'},
        ],
    },
};
