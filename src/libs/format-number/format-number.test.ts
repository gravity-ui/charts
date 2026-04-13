import {i18nInstance} from './i18n/i18n';
import type {FormatNumberOptions} from './types';

import {formatNumber} from '.';

i18nInstance.setLang('en');

const BYTES: FormatNumberOptions['units'] = {
    scale: {base: 1024, postfixes: ['B', 'KB', 'MB', 'GB', 'TB']},
};

const TIME: FormatNumberOptions['units'] = {
    scale: [
        {factor: 1, postfix: 's'},
        {factor: 60, postfix: 'min'},
        {factor: 3600, postfix: 'h'},
        {factor: 86400, postfix: 'd'},
    ],
};

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

    describe('formatNumber units (geometric scale)', () => {
        test.each<[number, FormatNumberOptions, string]>([
            [0, {units: BYTES}, '0 B'],
            [512, {units: BYTES}, '512 B'],
            [1024, {units: BYTES}, '1 KB'],
            [1536, {units: BYTES, precision: 1}, '1.5 KB'],
            [1048576, {units: BYTES}, '1 MB'],
            [1073741824, {units: BYTES}, '1 GB'],
            [-2048, {units: BYTES}, '-2 KB'],
            [0.3, {units: BYTES}, '0.3 B'],
        ])('value=%p options=%p → %p', (value, options, expected) => {
            expect(formatNumber(value, options)).toEqual(expected);
        });
    });

    describe('formatNumber units (entries scale, non-linear)', () => {
        test.each<[number, FormatNumberOptions, string]>([
            [45, {units: TIME}, '45 s'],
            [90, {units: TIME, precision: 1}, '1.5 min'],
            [3600, {units: TIME}, '1 h'],
            [7200, {units: TIME}, '2 h'],
            [90000, {units: TIME, precision: 2}, '1.04 d'],
        ])('value=%p options=%p → %p', (value, options, expected) => {
            expect(formatNumber(value, options)).toEqual(expected);
        });
    });

    test('non-ascending entries are sorted', () => {
        const reversed: FormatNumberOptions['units'] = {
            scale: [
                {factor: 3600, postfix: 'h'},
                {factor: 60, postfix: 'min'},
                {factor: 1, postfix: 's'},
            ],
        };
        expect(formatNumber(120, {units: reversed})).toEqual('2 min');
    });

    test('duplicate factors are deduped (first wins after sort)', () => {
        const dup: FormatNumberOptions['units'] = {
            scale: [
                {factor: 1, postfix: 's'},
                {factor: 60, postfix: 'min-a'},
                {factor: 60, postfix: 'min-b'},
            ],
        };
        expect(formatNumber(60, {units: dup})).toEqual('1 min-a');
    });

    test('single-entry scale always picks that entry', () => {
        const single: FormatNumberOptions['units'] = {scale: [{factor: 10, postfix: 'X'}]};
        expect(formatNumber(5, {units: single})).toEqual('0.5 X');
        expect(formatNumber(250, {units: single})).toEqual('25 X');
    });

    test('empty entries scale falls back to bare number', () => {
        expect(formatNumber(1234, {units: {scale: []}})).toEqual('1,234');
    });

    test('postfix="" suppresses trailing delimiter', () => {
        const mixed: FormatNumberOptions['units'] = {
            scale: [
                {factor: 1, postfix: ''},
                {factor: 1000, postfix: 'k'},
            ],
        };
        expect(formatNumber(500, {units: mixed})).toEqual('500');
        expect(formatNumber(2000, {units: mixed})).toEqual('2 k');
    });

    test('NaN short-circuits before units branch', () => {
        expect(formatNumber('nope' as unknown as number, {units: BYTES})).toEqual('NaN');
    });

    test('precision: "auto" in custom path', () => {
        expect(formatNumber(1536, {units: BYTES, precision: 'auto'})).toEqual('1.5 KB');
        expect(formatNumber(0.25, {units: BYTES, precision: 'auto'})).toEqual('0.25 B');
    });

    test('showRankDelimiter=false disables grouping', () => {
        expect(
            formatNumber(1536000, {
                units: {scale: [{factor: 1, postfix: 'B'}]},
                showRankDelimiter: false,
            }),
        ).toEqual('1536000 B');
    });

    test('prefix and postfix wrap custom path', () => {
        expect(formatNumber(2048, {units: BYTES, prefix: '~', postfix: '/s'})).toEqual('~2 KB/s');
    });

    test('multiplier applied before unit selection', () => {
        expect(formatNumber(2, {units: BYTES, multiplier: 1024})).toEqual('2 KB');
    });

    test('units overrides deprecated unit option', () => {
        expect(formatNumber(2048, {units: BYTES, unit: 'k'})).toEqual('2 KB');
    });

    describe('delimiter', () => {
        test('empty string removes the space', () => {
            const time: FormatNumberOptions['units'] = {...TIME, delimiter: ''};
            expect(formatNumber(3600, {units: time})).toEqual('1h');
        });

        test('custom string is used verbatim', () => {
            const bytes: FormatNumberOptions['units'] = {...BYTES, delimiter: '\u00a0'};
            expect(formatNumber(2048, {units: bytes})).toEqual('2\u00a0KB');
        });

        test('multi-char delimiter on geometric scale', () => {
            const bytes: FormatNumberOptions['units'] = {...BYTES, delimiter: ' — '};
            expect(formatNumber(1048576, {units: bytes, precision: 1})).toEqual('1.0 — MB');
        });

        test('still suppressed when postfix is empty', () => {
            const mixed: FormatNumberOptions['units'] = {
                scale: [
                    {factor: 1, postfix: ''},
                    {factor: 1000, postfix: 'k'},
                ],
                delimiter: ' · ',
            };
            expect(formatNumber(500, {units: mixed})).toEqual('500');
            expect(formatNumber(2000, {units: mixed})).toEqual('2 · k');
        });
    });
});
