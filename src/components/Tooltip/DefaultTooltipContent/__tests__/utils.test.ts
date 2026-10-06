import type {
    TooltipDataChunk,
    TooltipDataChunkAreaRange,
    TooltipDataChunkBarY,
} from '../../../../types';
import {
    getBuiltInAggregatedValue,
    getHoveredValues,
    getMeasureValue,
    getSortedHovered,
} from '../utils';

const createLineChunk = (name: string, value: number | null): TooltipDataChunk => ({
    data: {x: 1, y: value},
    series: {type: 'line', id: name, name},
});
const createBarYChunk = (name: string, value: number): TooltipDataChunkBarY => ({
    data: {x: value, y: 1},
    series: {type: 'bar-y', name, data: []},
});
const createAreaRangeChunk = (name: string, y0: number, y1: number): TooltipDataChunkAreaRange => ({
    data: {x: 1, y0, y1},
    series: {type: 'area-range', id: name, name},
});

const ASC = {key: 'value' as const, direction: 'asc' as const};
const DESC = {key: 'value' as const, direction: 'desc' as const};

describe('getMeasureValue with multiple Y axes', () => {
    it.each([
        {categories: ['First', 'Second'], value: 'Second'},
        {categories: ['First'], value: undefined},
    ])('resolves a Y header on its series axis: $categories', ({categories, value}) => {
        const headerFormat = {
            type: 'custom' as const,
            formatter: jest.fn(({value: headerValue}) => headerValue),
        };
        const series = {type: 'bar-y' as const, name: 'Horizontal', data: [], yAxis: 1};
        const yHeaderChunk: TooltipDataChunkBarY = {
            ...createBarYChunk('Horizontal', 10),
            series,
        };
        const result = getMeasureValue({
            data: [createLineChunk('Line', 20), yHeaderChunk],
            yAxes: [{type: 'linear'}, {type: 'category', categories}],
            headerFormat,
        });
        expect(result).toEqual({value, formattedValue: value});
        if (value === undefined) {
            expect(headerFormat.formatter).not.toHaveBeenCalled();
        } else {
            expect(headerFormat.formatter).toHaveBeenCalledTimes(1);
            expect(headerFormat.formatter).toHaveBeenCalledWith({value});
        }
    });
});

describe('getSortedHovered', () => {
    it('returns hovered as-is when sorting is undefined', () => {
        const hovered: TooltipDataChunk[] = [
            createLineChunk('C', 30),
            createLineChunk('A', 10),
            createLineChunk('B', 20),
        ];
        expect(getSortedHovered({hovered})).toBe(hovered);
    });

    it('sorts by value ascending', () => {
        const hovered: TooltipDataChunk[] = [
            createLineChunk('C', 30),
            createLineChunk('A', 10),
            createLineChunk('B', 20),
        ];
        const result = getSortedHovered({
            hovered,
            sorting: ASC,
            yAxes: [{type: 'linear'}],
        });
        expect(getHoveredValues({hovered: result, yAxes: [{type: 'linear'}]})).toEqual([
            10, 20, 30,
        ]);
        expect(result.map((c) => c.series.name)).toEqual(['A', 'B', 'C']);
    });

    it('sorts by value descending', () => {
        const hovered: TooltipDataChunk[] = [
            createLineChunk('A', 10),
            createLineChunk('B', 20),
            createLineChunk('C', 30),
        ];
        const result = getSortedHovered({
            hovered,
            sorting: DESC,
            yAxes: [{type: 'linear'}],
        });
        expect(getHoveredValues({hovered: result, yAxes: [{type: 'linear'}]})).toEqual([
            30, 20, 10,
        ]);
        expect(result.map((c) => c.series.name)).toEqual(['C', 'B', 'A']);
    });

    it('uses custom comparator when sorting is a function', () => {
        const hovered: TooltipDataChunk[] = [
            createLineChunk('Charlie', 10),
            createLineChunk('Alice', 30),
            createLineChunk('Bob', 20),
        ];
        const result = getSortedHovered({
            hovered,
            sorting: (a, b) => (a.series.name ?? '').localeCompare(b.series.name ?? ''),
            yAxes: [{type: 'linear'}],
        });
        expect(result.map((c) => c.series.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('returns empty array when hovered is empty', () => {
        const result = getSortedHovered({
            hovered: [],
            sorting: ASC,
            yAxes: [{type: 'linear'}],
        });
        expect(result).toEqual([]);
    });

    it('returns single-element array unchanged', () => {
        const hovered: TooltipDataChunk[] = [createLineChunk('A', 10)];
        const result = getSortedHovered({
            hovered,
            sorting: DESC,
            yAxes: [{type: 'linear'}],
        });
        expect(result).toEqual(hovered);
    });

    it('does not mutate original hovered array', () => {
        const hovered: TooltipDataChunk[] = [createLineChunk('C', 30), createLineChunk('A', 10)];
        const originalOrder = hovered.map((c) => c.series.name);
        getSortedHovered({hovered, sorting: ASC, yAxes: [{type: 'linear'}]});
        expect(hovered.map((c) => c.series.name)).toEqual(originalOrder);
    });

    it('places null values last when sorting descending', () => {
        const hovered: TooltipDataChunk[] = [
            createLineChunk('A', 10),
            createLineChunk('Null', null),
            createLineChunk('B', 5),
        ];
        const result = getSortedHovered({
            hovered,
            sorting: DESC,
            yAxes: [{type: 'linear'}],
        });
        expect(result.map((c) => c.series.name)).toEqual(['A', 'B', 'Null']);
    });

    it('places null values first when sorting ascending', () => {
        const hovered: TooltipDataChunk[] = [
            createLineChunk('A', 10),
            createLineChunk('Null', null),
            createLineChunk('B', 5),
        ];
        const result = getSortedHovered({
            hovered,
            sorting: ASC,
            yAxes: [{type: 'linear'}],
        });
        expect(result.map((c) => c.series.name)).toEqual(['Null', 'B', 'A']);
    });

    it('handles bar-y series with xAxis for value extraction', () => {
        const hovered: TooltipDataChunk[] = [
            createBarYChunk('High', 100),
            createBarYChunk('Low', 10),
            createBarYChunk('Mid', 50),
        ];
        const result = getSortedHovered({
            hovered,
            sorting: ASC,
            xAxis: {type: 'linear'},
        });
        expect(getHoveredValues({hovered: result, xAxis: {type: 'linear'}})).toEqual([10, 50, 100]);
    });

    it('uses area-range width for sorting and totals', () => {
        const hovered: TooltipDataChunk[] = [
            createAreaRangeChunk('Wide', 10, 30),
            createAreaRangeChunk('Narrow', 10, 15),
            createAreaRangeChunk('Medium', 10, 20),
        ];
        const result = getSortedHovered({hovered, sorting: ASC, yAxes: [{type: 'linear'}]});
        const values = getHoveredValues({hovered: result, yAxes: [{type: 'linear'}]});

        expect(values).toEqual([5, 10, 20]);
        expect(result.map((chunk) => chunk.series.name)).toEqual(['Narrow', 'Medium', 'Wide']);
        expect(getBuiltInAggregatedValue({aggregation: 'sum', values})).toBe(35);
    });

    it('sorts category values with missing and stale indices without throwing', () => {
        const yAxis = {type: 'category' as const, categories: ['First', 'Second']};
        const hovered: TooltipDataChunk[] = [1, null, undefined, 10, 0].map((y, i) => ({
            data: {x: 0, y},
            series: {type: 'scatter', id: String(i), name: String(i)},
        }));
        const sorted = getSortedHovered({hovered, yAxes: [yAxis], sorting: ASC});
        expect(sorted).toEqual([hovered[1], hovered[2], hovered[3], hovered[4], hovered[0]]);
        expect(getHoveredValues({hovered: sorted, yAxes: [yAxis]})).toEqual([
            null,
            undefined,
            undefined,
            'First',
            'Second',
        ]);
    });

    it('sorts legacy category values as resolved values', () => {
        const hovered: TooltipDataChunk[] = ['B', 'A'].map((category) => ({
            data: {category},
            series: {type: 'scatter', id: category, name: category},
        }));
        const yAxis = {type: 'category' as const, categories: ['A', 'B']};
        const sorted = getSortedHovered({hovered, yAxes: [yAxis], sorting: ASC});
        expect(sorted).toEqual([hovered[1], hovered[0]]);
        expect(getHoveredValues({hovered: sorted, yAxes: [yAxis]})).toEqual(['A', 'B']);
    });
});
