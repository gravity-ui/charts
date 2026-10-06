/** @jest-environment jsdom */
import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {render} from '@testing-library/react';

import {getSeriesPlugin} from '~core/series/seriesRegistry';

import type {
    ChartTooltipRowRendererArgs,
    TooltipDataChunkXRange,
    XRangeSeriesData,
} from '../../../../types';
import {DefaultTooltipContent} from '../index';
import {getBuiltInAggregatedValue, getHoveredValues, getSortedHovered} from '../utils';

function makeChunk(data: XRangeSeriesData, name = 'Interval'): TooltipDataChunkXRange {
    return {data, series: {type: 'x-range', name, data: []}};
}

it.each([
    [{x0: 5, x1: 15, y: 100}, 10],
    [{x0: 15, x1: 5, y: 'Category'}, 10],
    [{x0: 5, x1: 5}, 0],
    [{x0: '5', x1: '15', y: 0}, 10],
    [{x0: Date.UTC(2025, 0, 1), x1: Date.UTC(2025, 0, 2), y: 0}, 86400000],
] as [XRangeSeriesData, number][])(
    'uses interval duration for %j without changing point fields',
    (data, expected) => {
        const original = {...data};
        expect(getHoveredValues({hovered: [makeChunk(data)]})).toEqual([expected]);
        expect(getSeriesPlugin('x-range').getColorValue?.(data)).toBe(expected);
        expect(data).toEqual(original);
    },
);

it('sorts durations independently of Y positions and sums their widths', () => {
    const long = makeChunk({x0: 0, x1: 10, y: 0}, 'Long');
    const short = makeChunk({x0: 4, x1: 6, y: 2}, 'Short');
    const reverse = makeChunk({x0: 9, x1: 2, y: 1}, 'Reverse');
    const hovered = [long, short, reverse];
    const yAxes = [{type: 'category' as const, categories: ['A', 'Z', 'B']}];
    const ascending = getSortedHovered({hovered, yAxes, sorting: {key: 'value'}});
    expect(ascending).toEqual([short, reverse, long]);
    expect(getSortedHovered({hovered, yAxes, sorting: {key: 'value', direction: 'desc'}})).toEqual([
        long,
        reverse,
        short,
    ]);
    const values = getHoveredValues({hovered: ascending, yAxes});
    expect(values).toEqual([2, 7, 10]);
    expect(getBuiltInAggregatedValue({aggregation: 'sum', values})).toBe(19);
    expect(hovered).toEqual([long, short, reverse]);
});

it('keeps interval row values and header separate from the total duration', () => {
    const hovered = [makeChunk({x0: 0, x1: 10, y: 0}), makeChunk({x0: 4, x1: 6, y: 0})];
    const totalFormatter = jest.fn(({value}) => `total:${value}`);
    const rowRenderer = jest.fn(({id}: ChartTooltipRowRendererArgs) => <tr key={id} />);
    const {container} = render(
        <ThemeProvider theme="light">
            <DefaultTooltipContent
                hovered={hovered}
                yAxis={{type: 'category', categories: ['Task']}}
                rowRenderer={rowRenderer}
                totals={{enabled: true, valueFormat: {type: 'custom', formatter: totalFormatter}}}
            />
        </ThemeProvider>,
    );
    expect(rowRenderer.mock.calls.map(([args]) => args.value)).toEqual(['0 — 10', '4 — 6']);
    expect(totalFormatter).toHaveBeenCalledWith({value: 12});
    expect(container.textContent).toContain('Task');
});
