import {TOOLTIP_SORT_PRESET} from '../../../../constants';
import type {TooltipDataChunk, TooltipDataChunkBarY} from '../../../../types';
import {getHoveredValues, getSortedHovered} from '../utils';

const createLineChunk = (name: string, value: number): TooltipDataChunk => ({
    data: {x: 1, y: value},
    series: {type: 'line', id: name, name},
});
const createBarYChunk = (name: string, value: number): TooltipDataChunkBarY => ({
    data: {x: value, y: 1},
    series: {type: 'bar-y', name, data: []},
});

describe('getSortedHovered', () => {
    it('returns hovered as-is when sort is undefined', () => {
        const hovered: TooltipDataChunk[] = [
            createLineChunk('C', 30),
            createLineChunk('A', 10),
            createLineChunk('B', 20),
        ];
        expect(getSortedHovered({hovered})).toBe(hovered);
    });

    it('sorts by value ascending for valueAsc', () => {
        const hovered: TooltipDataChunk[] = [
            createLineChunk('C', 30),
            createLineChunk('A', 10),
            createLineChunk('B', 20),
        ];
        const result = getSortedHovered({
            hovered,
            sort: TOOLTIP_SORT_PRESET.VALUE_ASC,
            yAxis: {type: 'linear'},
        });
        expect(getHoveredValues({hovered: result, yAxis: {type: 'linear'}})).toEqual([10, 20, 30]);
        expect(result.map((c) => c.series.name)).toEqual(['A', 'B', 'C']);
    });

    it('sorts by value descending for valueDesc', () => {
        const hovered: TooltipDataChunk[] = [
            createLineChunk('A', 10),
            createLineChunk('B', 20),
            createLineChunk('C', 30),
        ];
        const result = getSortedHovered({
            hovered,
            sort: TOOLTIP_SORT_PRESET.VALUE_DESC,
            yAxis: {type: 'linear'},
        });
        expect(getHoveredValues({hovered: result, yAxis: {type: 'linear'}})).toEqual([30, 20, 10]);
        expect(result.map((c) => c.series.name)).toEqual(['C', 'B', 'A']);
    });

    it('uses custom comparator when sort is a function', () => {
        const hovered: TooltipDataChunk[] = [
            createLineChunk('Charlie', 10),
            createLineChunk('Alice', 30),
            createLineChunk('Bob', 20),
        ];
        const result = getSortedHovered({
            hovered,
            sort: (a, b) => (a.series.name ?? '').localeCompare(b.series.name ?? ''),
            yAxis: {type: 'linear'},
        });
        expect(result.map((c) => c.series.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('returns empty array when hovered is empty', () => {
        const result = getSortedHovered({
            hovered: [],
            sort: TOOLTIP_SORT_PRESET.VALUE_ASC,
            yAxis: {type: 'linear'},
        });
        expect(result).toEqual([]);
    });

    it('returns single-element array unchanged', () => {
        const hovered: TooltipDataChunk[] = [createLineChunk('A', 10)];
        const result = getSortedHovered({
            hovered,
            sort: TOOLTIP_SORT_PRESET.VALUE_DESC,
            yAxis: {type: 'linear'},
        });
        expect(result).toEqual(hovered);
    });

    it('does not mutate original hovered array', () => {
        const hovered: TooltipDataChunk[] = [createLineChunk('C', 30), createLineChunk('A', 10)];
        const originalOrder = hovered.map((c) => c.series.name);
        getSortedHovered({hovered, sort: TOOLTIP_SORT_PRESET.VALUE_ASC, yAxis: {type: 'linear'}});
        expect(hovered.map((c) => c.series.name)).toEqual(originalOrder);
    });

    it('handles bar-y series with xAxis for value extraction', () => {
        const hovered: TooltipDataChunk[] = [
            createBarYChunk('High', 100),
            createBarYChunk('Low', 10),
            createBarYChunk('Mid', 50),
        ];
        const result = getSortedHovered({
            hovered,
            sort: TOOLTIP_SORT_PRESET.VALUE_ASC,
            xAxis: {type: 'linear'},
        });
        expect(getHoveredValues({hovered: result, xAxis: {type: 'linear'}})).toEqual([10, 50, 100]);
    });
});
