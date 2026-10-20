import {scaleBand, scaleLinear, scaleLog, scaleUtc} from 'd3-scale';

import {getNormalizedXAxis} from '../../../components/ChartInner/utils/normalized-original-data';
import type {AxisLabelLevel} from '../../../types';
import {createLabelRangeProjector, prepareAxisLabelLevels} from '../label-levels';

describe('additional axis label levels', () => {
    test('formats values independently of their coordinates without changing raw data', () => {
        const custom = jest.fn(({value}) => `Group ${value}`);
        const levels: AxisLabelLevel[] = [
            {ranges: [{from: 0, to: 2, value: 'January'}]},
            {
                format: {type: 'date', format: 'YYYY'},
                ranges: [{from: 0, to: 2, value: Date.UTC(2026, 0, 1)}],
            },
            {format: {type: 'custom', formatter: custom}, ranges: [{from: 0, to: 2, value: 5}]},
        ];
        const original = levels.map((level) => ({
            ...level,
            ranges: level.ranges.map((range) => ({...range})),
        }));
        expect(prepareAxisLabelLevels(levels).map((level) => level.ranges[0].text)).toEqual([
            'January',
            '2026',
            'Group 5',
        ]);
        expect(custom).toHaveBeenCalledWith({value: 5});
        expect(levels).toEqual(original);
        expect(prepareAxisLabelLevels([{ranges: []}])).toEqual([]);
    });

    test('includes full category bands and keeps original ordered indexes after clipping and missing categories', () => {
        const axis = getNormalizedXAxis({
            xAxis: {
                type: 'category',
                categories: ['D', 'C', 'B', 'A'],
                order: 'sortAsc',
                min: 1,
            },
        })!;
        const scale = scaleBand().domain(['B', 'D']).range([0, 200]);
        const project = createLabelRangeProjector(axis, scale, 200);
        expect(project({from: 0, to: 2})).toEqual({from: 0, to: 100});
        expect(project({from: 3, to: 3})).toEqual({from: 100, to: 200});
        expect(project({from: 2, to: 2})).toBeUndefined();
        expect(axis.categories).toEqual(['B', 'C', 'D']);
    });

    test('supports reversed category ranges and gaps', () => {
        const scale = scaleBand().domain(['A', 'B', 'C']).range([300, 0]).paddingInner(0.2);
        const project = createLabelRangeProjector(
            {type: 'category', categories: ['A', 'B', 'C']},
            scale,
            300,
        );
        const span = project({from: 0, to: 1})!;
        expect(span.from).toBeCloseTo(scale('B')!);
        expect(span.to).toBeCloseTo(scale('A')! + scale.bandwidth());
    });

    test.each([scaleLinear().domain([-10, 10]), scaleUtc().domain([new Date(-10), new Date(10)])])(
        'clips continuous intervals to the visible scale',
        (scale) => {
            scale.range([0, 200]);
            const project = createLabelRangeProjector({}, scale, 200);
            expect(project({from: -20, to: 0})).toEqual({from: 0, to: 100});
            expect(project({from: 0, to: 0})).toBeUndefined();
            expect(project({from: 10, to: 20})).toBeUndefined();
        },
    );

    test('uses pixel spans for logarithmic and reversed scales', () => {
        const project = createLabelRangeProjector(
            {type: 'logarithmic'},
            scaleLog().domain([1, 1000]).range([300, 0]),
            300,
        );
        const span = project({from: 1, to: 100})!;
        expect(span.from).toBeCloseTo(100);
        expect(span.to).toBeCloseTo(300);
        expect((span.from + span.to) / 2).toBeCloseTo(200);
    });

    test.each([0, -10])(
        'does not produce geometry for nonpositive available length %s',
        (length) => {
            const project = createLabelRangeProjector(
                {},
                scaleLinear().domain([0, 10]).range([0, length]),
                length,
            );
            expect(project({from: 0, to: 10})).toBeUndefined();
        },
    );
});
