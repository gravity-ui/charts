import {i18nInstance} from './i18n/i18n';
import type {FormatNumberOptions} from './types';

import {formatNumber} from '.';

i18nInstance.setLang('en');

const BYTES: FormatNumberOptions['units'] = {
    base: 1024,
    labels: ['B', 'KB', 'MB', 'GB', 'TB'],
};

const TIME: FormatNumberOptions['units'] = [
    {factor: 1, label: 's'},
    {factor: 60, label: 'min'},
    {factor: 3600, label: 'h'},
    {factor: 86400, label: 'd'},
];

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

    describe('formatNumber units (object form)', () => {
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

    describe('formatNumber units (array form, non-linear)', () => {
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

    test('non-ascending array input is sorted', () => {
        const reversed: FormatNumberOptions['units'] = [
            {factor: 3600, label: 'h'},
            {factor: 60, label: 'min'},
            {factor: 1, label: 's'},
        ];
        expect(formatNumber(120, {units: reversed})).toEqual('2 min');
    });

    test('duplicate factors are deduped (first wins after sort)', () => {
        const dup: FormatNumberOptions['units'] = [
            {factor: 1, label: 's'},
            {factor: 60, label: 'min-a'},
            {factor: 60, label: 'min-b'},
        ];
        expect(formatNumber(60, {units: dup})).toEqual('1 min-a');
    });

    test('single-entry array always picks that entry', () => {
        const single: FormatNumberOptions['units'] = [{factor: 10, label: 'X'}];
        expect(formatNumber(5, {units: single})).toEqual('0.5 X');
        expect(formatNumber(250, {units: single})).toEqual('25 X');
    });

    test('empty array falls back to bare number', () => {
        expect(formatNumber(1234, {units: []})).toEqual('1,234');
    });

    test('label="" suppresses trailing delimiter', () => {
        const mixed: FormatNumberOptions['units'] = [
            {factor: 1, label: ''},
            {factor: 1000, label: 'k'},
        ];
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
            formatNumber(1536000, {units: [{factor: 1, label: 'B'}], showRankDelimiter: false}),
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

    describe('unitDelimiter', () => {
        test('empty string removes the space', () => {
            expect(formatNumber(3600, {units: TIME, unitDelimiter: ''})).toEqual('1h');
        });

        test('custom string is used verbatim', () => {
            expect(formatNumber(2048, {units: BYTES, unitDelimiter: '\u00a0'})).toEqual(
                '2\u00a0KB',
            );
        });

        test('unitDelimiter still suppressed when label is empty', () => {
            const mixed: FormatNumberOptions['units'] = [
                {factor: 1, label: ''},
                {factor: 1000, label: 'k'},
            ];
            expect(formatNumber(500, {units: mixed, unitDelimiter: ' · '})).toEqual('500');
            expect(formatNumber(2000, {units: mixed, unitDelimiter: ' · '})).toEqual('2 · k');
        });
    });
});
