import type {FormatNumberOptions} from '../../libs/format-number/types';

import type {FormatNumberOptionsV1} from './types';

/** The v1 suffixes have no space. A single-entry scale also disables automatic axis units. */
export function migrateNumberFormatV1(options: FormatNumberOptionsV1): FormatNumberOptions {
    const {unit, ...result} = options;
    if (options.units || !Object.prototype.hasOwnProperty.call(options, 'unit')) return result;
    if (unit === 'auto') {
        return {
            ...result,
            units: {scale: {base: 1000, postfixes: ['', 'K', 'M', 'B', 'T']}, delimiter: ''},
        };
    }
    const index = unit === null || unit === undefined ? 0 : ['k', 'm', 'b', 't'].indexOf(unit) + 1;
    return {
        ...result,
        units: {
            scale: [{factor: 1000 ** index, postfix: ['', 'K', 'M', 'B', 'T'][index]}],
            delimiter: '',
        },
    };
}
