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
