import {getFormattedValue} from '../format';

describe('getFormattedValue', () => {
    describe('without format', () => {
        test('returns String(value) for number', () => {
            expect(getFormattedValue({value: 42})).toBe('42');
        });

        test('returns String(value) for string', () => {
            expect(getFormattedValue({value: 'hello'})).toBe('hello');
        });

        test('returns "null" for null', () => {
            expect(getFormattedValue({value: null})).toBe('null');
        });

        test('returns "undefined" for undefined', () => {
            expect(getFormattedValue({value: undefined})).toBe('undefined');
        });
    });

    describe('type: "number"', () => {
        test('formats number with precision', () => {
            // Locale-agnostic: decimal separator may be "." or ",".
            expect(
                getFormattedValue({value: 1.2345, format: {type: 'number', precision: 2}}),
            ).toMatch(/^1[.,]23$/);
        });

        test('formats as percent', () => {
            expect(
                getFormattedValue({
                    value: 0.156,
                    format: {type: 'number', format: 'percent', precision: 1},
                }),
            ).toMatch(/^15[.,]6%$/);
        });

        test('falls back to String(value) when value is not a number', () => {
            expect(getFormattedValue({value: 'abc', format: {type: 'number', precision: 2}})).toBe(
                'abc',
            );
        });
    });

    describe('type: "date"', () => {
        // 2024-01-15 00:00:00 UTC
        const MIDNIGHT_JAN15 = 1705276800000;

        test('formats timestamp with provided format', () => {
            expect(
                getFormattedValue({
                    value: MIDNIGHT_JAN15,
                    format: {type: 'date', format: 'YYYY-MM-DD'},
                }),
            ).toBe('2024-01-15');
        });

        test('falls back to String(value) for invalid date', () => {
            expect(getFormattedValue({value: 'not-a-date', format: {type: 'date'}})).toBe(
                'not-a-date',
            );
        });
    });

    describe('type: "custom"', () => {
        test('invokes formatter with raw value and returns its result', () => {
            const formatter = jest.fn(({value}) => `v:${value}`);

            expect(getFormattedValue({value: 42, format: {type: 'custom', formatter}})).toBe(
                'v:42',
            );
            expect(formatter).toHaveBeenCalledTimes(1);
            expect(formatter).toHaveBeenCalledWith({value: 42});
        });

        test('works for string values', () => {
            expect(
                getFormattedValue({
                    value: 'apple',
                    format: {
                        type: 'custom',
                        formatter: ({value}) => String(value).toUpperCase(),
                    },
                }),
            ).toBe('APPLE');
        });

        test('works for null values', () => {
            expect(
                getFormattedValue({
                    value: null,
                    format: {
                        type: 'custom',
                        formatter: ({value}) => (value === null ? '—' : String(value)),
                    },
                }),
            ).toBe('—');
        });

        test('works for undefined values', () => {
            expect(
                getFormattedValue({
                    value: undefined,
                    format: {
                        type: 'custom',
                        formatter: ({value}) => (value === undefined ? 'n/a' : String(value)),
                    },
                }),
            ).toBe('n/a');
        });
    });
});
