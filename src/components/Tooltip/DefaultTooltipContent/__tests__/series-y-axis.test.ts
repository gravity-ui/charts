import * as seriesRegistry from '~core/series/seriesRegistry';

import type {ChartYAxis, TooltipDataChunk, TooltipDataChunkLine} from '../../../../types';
import {getHoveredValues, getMeasureValue, getPreparedHovered, getSortedHovered} from '../utils';

function makeChunk(name: string, y: number, yAxis?: number): TooltipDataChunkLine {
    const series = {type: 'line' as const, id: name, name, ...(yAxis === undefined ? {} : {yAxis})};
    return {data: {x: 0, y}, series};
}

afterEach(() => jest.restoreAllMocks());

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
    expect(getHoveredValues({hovered, yAxes})).toEqual([10, 'Second']);
    expect(getHoveredValues({hovered: [hovered[0]], yAxes: [yAxes[0]]})).toEqual([10]);
});

it.each([undefined, null, 1, -1, 0.5, NaN])('falls back to axis 0 for index %s', (index) => {
    const hovered = [makeChunk('Primary', 0, index as number | undefined)];
    const yAxes: ChartYAxis[] = [{type: 'category', categories: ['First']}];
    expect(getHoveredValues({hovered, yAxes})).toEqual(['First']);
});

it('keeps raw values when no Y axes are supplied', () => {
    const hovered = [makeChunk('Primary', 0, 1)];
    expect(getHoveredValues({hovered, yAxes: []})).toEqual([0]);
    expect(getHoveredValues({hovered})).toEqual([0]);
});

it.each([
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
])('sorts mixed types consistently for input %s, %s, %s', (...indices) => {
    const chunks = [makeChunk('Two', 2), makeChunk('Ten', 10), makeChunk('Category', 0, 1)];
    const hovered = indices.map((index) => chunks[index]);
    const yAxes: ChartYAxis[] = [{type: 'linear'}, {type: 'category', categories: ['1x']}];
    expect(getSortedHovered({hovered, yAxes, sorting: {key: 'value'}})).toEqual(chunks);
    expect(getSortedHovered({hovered, yAxes, sorting: {key: 'value', direction: 'desc'}})).toEqual([
        chunks[2],
        chunks[1],
        chunks[0],
    ]);
    expect(hovered).toEqual(indices.map((index) => chunks[index]));
});

it.each(['bar-y', 'x-range'] as const)(
    'uses the %s header chunk after mixed-series sorting',
    (type) => {
        const horizontal: TooltipDataChunk =
            type === 'bar-y'
                ? {data: {x: 10, y: 0}, series: {type, name: 'Horizontal', data: []}}
                : {data: {x0: 10, x1: 20, y: 0}, series: {type, name: 'Horizontal', data: []}};
        const other: TooltipDataChunk = {
            data: {x: 0, y: 1},
            series: {type: 'scatter', id: 'other', name: 'Other', yAxis: 1},
        };
        const yAxes: ChartYAxis[] = [
            {type: 'category', categories: ['Correct']},
            {type: 'category', categories: ['Other', 'Aardvark']},
        ];
        const data = getSortedHovered({
            hovered: [horizontal, other],
            yAxes,
            sorting: {key: 'value'},
        });
        // x-range sorts by duration; bar-y sorts by numeric X.
        for (const hovered of [data, [...data].reverse()]) {
            const formatter = jest.fn(({value}) => String(value));
            expect(
                getMeasureValue({data: hovered, yAxes, headerFormat: {type: 'custom', formatter}}),
            ).toEqual({value: 'Correct', formattedValue: 'Correct'});
            expect(formatter).toHaveBeenCalledTimes(1);
        }
    },
);

it.each([
    {sorting: undefined, order: [0, 1], values: [10, 1]},
    {sorting: {key: 'value' as const}, order: [1, 0], values: [1, 10]},
])(
    'resolves plugin values once and keeps them aligned with sorting %j',
    ({sorting, order, values}) => {
        const getValue = jest.fn(({item}) => item.data.y);
        const original = seriesRegistry.getSeriesPlugin;
        jest.spyOn(seriesRegistry, 'getSeriesPlugin').mockImplementation((type) => {
            const plugin = original(type);
            return {...plugin, tooltip: {...plugin.tooltip, getValue}};
        });
        const hovered = [makeChunk('Primary', 10), makeChunk('Secondary', 1, 1)];
        const yAxes: ChartYAxis[] = [
            {type: 'linear'},
            {type: 'category', categories: ['First', 'Second']},
        ];
        expect(getPreparedHovered({hovered, yAxes, sorting})).toEqual({
            hovered: order.map((index) => hovered[index]),
            values,
        });
        expect(getValue).toHaveBeenCalledTimes(2);
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
    },
);

it('orders missing values, NaN, numbers and labels without a mixed-type comparison cycle', () => {
    const hovered: TooltipDataChunkLine[] = [
        makeChunk('Ten', 10),
        makeChunk('Label', 0, 1),
        makeChunk('Two', 2),
        makeChunk('NaN', NaN),
        {...makeChunk('Null', 0), data: {x: 0, y: null}},
        {...makeChunk('Undefined', 0), data: {x: 0, y: undefined}},
    ];
    const yAxes: ChartYAxis[] = [{type: 'linear'}, {type: 'category', categories: ['1x']}];
    const sorted = getSortedHovered({hovered, yAxes, sorting: {key: 'value'}});
    expect(sorted).toEqual([
        hovered[4],
        hovered[5],
        hovered[3],
        hovered[2],
        hovered[0],
        hovered[1],
    ]);
    expect(getSortedHovered({hovered, yAxes, sorting: {key: 'value', direction: 'desc'}})).toEqual([
        hovered[1],
        hovered[0],
        hovered[2],
        hovered[3],
        hovered[4],
        hovered[5],
    ]);
});
