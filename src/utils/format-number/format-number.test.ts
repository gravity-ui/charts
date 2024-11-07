import {formatNumber} from './format-number';
import {i18nInstance} from './i18n/i18n';
import type {FormatNumberOptions} from './types';

i18nInstance.setLang('en');

describe('plugins/shared', () => {
    test.each<[unknown, FormatNumberOptions | undefined, string]>([
        ['not-a-number', undefined, 'NaN'],
        [NaN, undefined, 'NaN'],
        ['0.2211556', undefined, '0.2211556'],
        ['0.2211556', {precision: 4}, '0.2212'],
    ])('formatNumber (args: {value: %p, options: %p})', (value, options, expected) => {
        const result = formatNumber(value as number, options);
        expect(result).toEqual(expected);
    });
});
