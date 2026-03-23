import type {PreparedAxis} from '../../../hooks';
import type {LabelData} from '../../../types';
import {formatAxisTickLabel} from '../format';
import {filterOverlappingLabels} from '../labels';
import {TIME_UNITS} from '../time';

describe('filterOverlappingLabels', () => {
    const label1 = {
        text: 'A',
        x: 10,
        y: 5,
        size: {
            width: 20,
            height: 15,
        },
        textAnchor: 'middle',
    };

    it('overlap by X and Y -> remove overlapping', () => {
        const label2 = {
            text: 'B',
            x: 22,
            y: 7,
            size: {
                width: 10,
                height: 15,
            },
            textAnchor: 'middle',
        };
        const labels = [label1, label2];
        expect(filterOverlappingLabels(labels as LabelData[])).toEqual([label1]);
    });

    it('overlap only by X -> do nothing ', () => {
        const label2 = {
            text: 'B',
            x: 22,
            y: 100,
            size: {
                width: 10,
                height: 15,
            },
            textAnchor: 'middle',
        };
        const labels = [label1, label2];
        expect(filterOverlappingLabels(labels as LabelData[])).toEqual([label1, label2]);
    });

    it('overlap only by Y -> do nothing ', () => {
        const label2 = {
            text: 'B',
            x: 200,
            y: 7,
            size: {
                width: 10,
                height: 15,
            },
            textAnchor: 'middle',
        };
        const labels = [label1, label2];
        expect(filterOverlappingLabels(labels as LabelData[])).toEqual([label1, label2]);
    });
});

// Helper: create a minimal PreparedAxis mock for datetime type
function makeDatetimeAxis(dateFormat?: string): PreparedAxis {
    return {
        type: 'datetime',
        labels: {
            dateFormat,
            enabled: true,
            html: false,
            margin: 4,
            padding: 4,
            rotation: 0,
            height: 20,
            width: 0,
            lineHeight: 14,
            maxWidth: 200,
            style: {},
            numberFormat: undefined,
        },
    } as unknown as PreparedAxis;
}

describe('formatAxisTickLabel - datetime smart sub-day formatting', () => {
    // 2024-01-15 00:00:00 UTC
    const MIDNIGHT_JAN15 = 1705276800000;
    // 2024-01-15 06:00:00 UTC
    const SIX_AM_JAN15 = MIDNIGHT_JAN15 + 6 * TIME_UNITS.hour;
    // 2024-01-15 00:30:00 UTC
    const HALF_PAST_MIDNIGHT = MIDNIGHT_JAN15 + 30 * TIME_UNITS.minute;

    describe('step < day, no custom dateFormat', () => {
        const axis = makeDatetimeAxis();

        test('midnight tick → DD.MM.YY', () => {
            expect(formatAxisTickLabel({axis, value: MIDNIGHT_JAN15, step: TIME_UNITS.hour})).toBe(
                '15.01.24',
            );
        });

        test('non-midnight hour tick → HH:mm', () => {
            expect(formatAxisTickLabel({axis, value: SIX_AM_JAN15, step: TIME_UNITS.hour})).toBe(
                '06:00',
            );
        });

        test('non-midnight minute tick → HH:mm', () => {
            expect(
                formatAxisTickLabel({axis, value: HALF_PAST_MIDNIGHT, step: TIME_UNITS.minute}),
            ).toBe('00:30');
        });

        test('second-level step, non-midnight → HH:mm:ss', () => {
            const TICK = MIDNIGHT_JAN15 + 45 * TIME_UNITS.second;
            expect(formatAxisTickLabel({axis, value: TICK, step: TIME_UNITS.second})).toBe(
                '00:00:45',
            );
        });

        test('millisecond-level step, non-midnight → HH:mm:ss.SSS', () => {
            const TICK = MIDNIGHT_JAN15 + 500;
            expect(formatAxisTickLabel({axis, value: TICK, step: TIME_UNITS.millisecond})).toBe(
                '00:00:00.500',
            );
        });
    });

    describe('custom dateFormat is set → old behaviour (ignores smart logic)', () => {
        const axis = makeDatetimeAxis('YYYY');

        test('midnight tick uses custom format', () => {
            expect(formatAxisTickLabel({axis, value: MIDNIGHT_JAN15, step: TIME_UNITS.hour})).toBe(
                '2024',
            );
        });
    });

    describe('step >= day → old behaviour', () => {
        const axis = makeDatetimeAxis();

        test('day step: midnight tick uses DD.MM.YY via getDefaultDateFormat', () => {
            expect(formatAxisTickLabel({axis, value: MIDNIGHT_JAN15, step: TIME_UNITS.day})).toBe(
                '15.01.24',
            );
        });
    });
});
