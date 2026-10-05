/** @jest-environment jsdom */
import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {act, render, renderHook} from '@testing-library/react';
import {dispatch} from 'd3-dispatch';

import type {PreparedYAxis} from '~core/axes/types';
import * as seriesRegistry from '~core/series/seriesRegistry';

import {ChartTooltipContent, TooltipContent} from '../../../components/Tooltip/ChartTooltipContent';
import type {ChartYAxis, TooltipDataChunkLine} from '../../../types';
import type {PreparedTooltip} from '../../types';
import {useTooltip} from '../index';

function makeChunk(name: string, y: number, yAxis: number): TooltipDataChunkLine {
    const series = {type: 'line' as const, id: name, name, yAxis};
    return {data: {x: 0, y}, series};
}

it('uses all Y axes for hover sorting and clears stale chunks when a secondary axis changes', () => {
    const dispatcher = dispatch('hover-shape');
    const tooltip = {enabled: true, sorting: {key: 'value'}} as PreparedTooltip;
    const yAxis = [
        {type: 'category', categories: ['Zebra']},
        {type: 'category', categories: ['Bee', 'Ant']},
    ] as PreparedYAxis[];
    const hovered = [makeChunk('Primary', 0, 0), makeChunk('Secondary', 1, 1)];
    const {result, rerender} = renderHook((props) => useTooltip(props), {
        initialProps: {dispatcher, tooltip, yAxis},
    });
    act(() => dispatcher.call('hover-shape', undefined, hovered, [10, 20]));
    expect(result.current.hovered).toEqual([hovered[1], hovered[0]]);
    expect(result.current.hoveredValues).toEqual(['Ant', 'Zebra']);
    rerender({dispatcher, tooltip, yAxis: [yAxis[0], {...yAxis[1], categories: ['Only']}]});
    expect(result.current.hovered).toBeUndefined();
    expect(result.current.hoveredValues).toBeUndefined();
});

it('uses each series axis for built-in totals while preserving custom callback arguments', () => {
    const hovered = [makeChunk('Primary', 10, 0), makeChunk('Secondary', 1, 1)];
    const yAxes: ChartYAxis[] = [
        {type: 'linear'},
        {type: 'category', categories: ['First', 'Second']},
    ];
    const formatter = jest.fn(({value}) => String(value));
    const renderer = jest.fn(() => null);
    render(
        <ThemeProvider theme="light">
            <TooltipContent
                yAxes={yAxes}
                hovered={hovered}
                yAxis={yAxes[0]}
                renderer={renderer}
                totals={{enabled: true, valueFormat: {type: 'custom', formatter}}}
            />
        </ThemeProvider>,
    );
    expect(formatter).toHaveBeenCalledWith({value: 10});
    expect(renderer).toHaveBeenCalledWith(
        expect.objectContaining({hovered, yAxis: yAxes[0], yAxes}),
    );
});

afterEach(() => jest.restoreAllMocks());

it('honors an explicit public yAxis inside a custom renderer, just as outside the chart', () => {
    const hovered = [makeChunk('Secondary', 0, 1), makeChunk('Primary', 1, 0)];
    const yAxes: ChartYAxis[] = [
        {type: 'category', categories: ['First', 'Second']},
        {type: 'linear'},
    ];
    const customAxis: ChartYAxis = {type: 'linear'};
    const totalsFormatter = jest.fn(({value}) => String(value));
    const totals = {
        enabled: true,
        valueFormat: {type: 'custom' as const, formatter: totalsFormatter},
    };
    const {rerender} = render(
        <ThemeProvider theme="light">
            <TooltipContent
                hovered={hovered}
                yAxis={yAxes[0]}
                yAxes={yAxes}
                hoveredValues={['Ignored', 'Ignored']}
                renderer={(args) => (
                    <ChartTooltipContent {...args} yAxis={customAxis} totals={totals} />
                )}
            />
        </ThemeProvider>,
    );
    expect(totalsFormatter).toHaveBeenCalledWith({value: 1});
    totalsFormatter.mockClear();
    rerender(
        <ThemeProvider theme="light">
            <ChartTooltipContent hovered={hovered} yAxis={customAxis} totals={totals} />
        </ThemeProvider>,
    );
    expect(totalsFormatter).toHaveBeenCalledWith({value: 1});
});

it('provides all Y axes to custom totals and row renderers', () => {
    const hovered = [makeChunk('Primary', 10, 0), makeChunk('Secondary', 1, 1)];
    const yAxes: ChartYAxis[] = [
        {type: 'linear'},
        {type: 'category', categories: ['First', 'Second']},
    ];
    const aggregation = jest.fn(({hovered: chunks, yAxes: axes}) =>
        chunks.reduce((sum: number, item: TooltipDataChunkLine) => {
            const axis = axes[item.series.yAxis ?? 0] ?? axes[0];
            return (
                sum +
                (axis.type !== 'category' && typeof item.data.y === 'number' ? item.data.y : 0)
            );
        }, 0),
    );
    const formatter = jest.fn(({value}) => String(value));
    const rowRenderer = jest.fn(({id}) => <tr key={id} />);
    render(
        <ThemeProvider theme="light">
            <TooltipContent
                hovered={hovered}
                yAxis={yAxes[0]}
                yAxes={yAxes}
                rowRenderer={rowRenderer}
                totals={{enabled: true, aggregation, valueFormat: {type: 'custom', formatter}}}
            />
        </ThemeProvider>,
    );
    expect(aggregation).toHaveBeenCalledWith({hovered, xAxis: undefined, yAxis: yAxes[0], yAxes});
    expect(formatter).toHaveBeenCalledWith({value: 10});
    expect(rowRenderer).toHaveBeenCalledTimes(2);
    expect(rowRenderer).toHaveBeenCalledWith(expect.objectContaining({hovered, yAxes}));
});

it('reuses prepared values for totals after sorting instead of resolving plugin values again', () => {
    const original = seriesRegistry.getSeriesPlugin;
    const getValue = jest.fn(({item}) => item.data.y);
    jest.spyOn(seriesRegistry, 'getSeriesPlugin').mockImplementation((type) => {
        const plugin = original(type);
        return {...plugin, tooltip: {...plugin.tooltip, getValue}};
    });
    const dispatcher = dispatch('hover-shape');
    const tooltip = {enabled: true, sorting: {key: 'value'}} as PreparedTooltip;
    const yAxis = [{type: 'linear'}] as PreparedYAxis[];
    const hovered = [makeChunk('Ten', 10, 0), makeChunk('One', 1, 0)];
    const formatter = jest.fn(({value}) => String(value));
    const {result} = renderHook(() => useTooltip({dispatcher, tooltip, yAxis}));
    act(() => dispatcher.call('hover-shape', undefined, hovered, [10, 20]));
    render(
        <ThemeProvider theme="light">
            <TooltipContent
                hovered={result.current.hovered}
                hoveredValues={result.current.hoveredValues}
                yAxes={yAxis}
                totals={{enabled: true, valueFormat: {type: 'custom', formatter}}}
            />
        </ThemeProvider>,
    );
    expect(getValue).toHaveBeenCalledTimes(2);
    expect(formatter).toHaveBeenCalledWith({value: 11});
    expect(hovered.map((item) => item.data.y)).toEqual([10, 1]);
});

it('formats the built-in header once', () => {
    const formatter = jest.fn(({value}) => `header:${value}`);
    render(
        <ThemeProvider theme="light">
            <ChartTooltipContent
                hovered={[makeChunk('Primary', 10, 0)]}
                headerFormat={{type: 'custom', formatter}}
            />
        </ThemeProvider>,
    );
    expect(formatter).toHaveBeenCalledTimes(1);
    expect(formatter).toHaveBeenCalledWith({value: 0});
});
