import {getSeriesPlugin} from '~core/series/seriesRegistry';

import type {ChartYAxis, TooltipDataChunkLine} from '../../../../types';
import {getHoveredValues, getSortedHovered} from '../utils';

function makeChunk(name: string, y: number, yAxis?: number): TooltipDataChunkLine {
    const series = {type: 'line' as const, id: name, name, ...(yAxis === undefined ? {} : {yAxis})};
    return {data: {x: 0, y}, series};
}

it('resolves and sorts category indices using each series Y axis', () => {
    const first = makeChunk('Primary', 0);
    const second = makeChunk('Secondary', 1, 1);
    const yAxes: ChartYAxis[] = [
        {type: 'category', categories: ['Zebra']},
        {type: 'category', categories: ['Bee', 'Ant']},
    ];
    expect(getHoveredValues({hovered: [first, second], yAxes})).toEqual(['Zebra', 'Ant']);
    expect(getSortedHovered({hovered: [first, second], yAxes, sorting: {key: 'value'}})).toEqual([
        second,
        first,
    ]);
    expect(first.data.y).toBe(0);
    expect(second.data.y).toBe(1);
});

it('keeps continuous values and resolves secondary categories in mixed-axis charts', () => {
    const yAxes: ChartYAxis[] = [
        {type: 'linear'},
        {type: 'category', categories: ['First', 'Second']},
    ];
    const hovered = [makeChunk('Primary', 10), makeChunk('Secondary', 1, 1)];
    expect(getHoveredValues({hovered, yAxis: yAxes[0], yAxes})).toEqual([10, 'Second']);
    expect(getHoveredValues({hovered: [hovered[0]], yAxis: yAxes[0]})).toEqual([10]);
});

it('passes the assigned Y axis and original chunk to plugin overrides', () => {
    const tooltip = getSeriesPlugin('line').tooltip;
    const original = tooltip.getValue;
    const getValue = jest.fn(() => 42);
    tooltip.getValue = getValue;
    const hovered = [makeChunk('Primary', 10), makeChunk('Secondary', 1, 1)];
    const yAxes: ChartYAxis[] = [
        {type: 'linear'},
        {type: 'category', categories: ['First', 'Second']},
    ];
    try {
        expect(getHoveredValues({hovered, yAxes})).toEqual([42, 42]);
        expect(getValue).toHaveBeenNthCalledWith(1, {
            item: hovered[0],
            xAxis: undefined,
            yAxis: yAxes[0],
        });
        expect(getValue).toHaveBeenNthCalledWith(2, {
            item: hovered[1],
            xAxis: undefined,
            yAxis: yAxes[1],
        });
    } finally {
        tooltip.getValue = original;
    }
});
