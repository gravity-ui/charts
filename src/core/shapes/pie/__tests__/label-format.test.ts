import {pie} from 'd3-shape';

import type {PieSeriesData} from '../../../types';
import {
    getPieDataLabelSourceValue,
    getPieDataLabelText,
    getPieSegmentPercentage,
} from '../label-format';
import type {SegmentData} from '../types';

function createSegments(values: number[]) {
    return pie<SegmentData>()
        .value((d) => d.value)
        .sort(null)(
        values.map((value, index) => ({
            value,
            color: '#000',
            opacity: null,
            series: {} as SegmentData['series'],
            hovered: false,
            active: true,
            pie: {} as SegmentData['pie'],
            radius: 100,
            id: String(index),
        })),
    );
}

describe('pie label format', () => {
    const data: PieSeriesData = {
        name: 'A',
        value: 10,
        label: '10 (40%)',
    };

    test('uses point.value when dataLabels.format is set', () => {
        expect(getPieDataLabelSourceValue(data, {format: {type: 'number'}})).toBe(10);
        expect(getPieDataLabelSourceValue(data, {})).toBe('10 (40%)');
    });

    test('derives percentage from segment angles', () => {
        const segments = createSegments([10, 10, 5]);
        expect(getPieSegmentPercentage(segments[0])).toBeCloseTo(0.4);

        const visibleSegments = createSegments([10, 10]);
        expect(getPieSegmentPercentage(visibleSegments[0])).toBeCloseTo(0.5);
    });

    test('formats label with dynamic percentage among visible slices', () => {
        const formatter = jest.fn(
            ({value, percentage}: {value: unknown; percentage?: number}) =>
                `${value} (${Math.round((percentage ?? 0) * 100)}%)`,
        );
        const visibleSegments = createSegments([10, 10]);

        expect(
            getPieDataLabelText({
                data,
                dataLabels: {format: {type: 'custom', formatter}},
                percentage: getPieSegmentPercentage(visibleSegments[0]),
            }),
        ).toBe('10 (50%)');
        expect(formatter).toHaveBeenCalledWith(
            expect.objectContaining({value: 10, percentage: 0.5, name: 'A', data}),
        );
    });
});
