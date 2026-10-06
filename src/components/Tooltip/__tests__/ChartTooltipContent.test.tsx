/* @jest-environment jsdom */
import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {act, render, renderHook, screen} from '@testing-library/react';
import {dispatch} from 'd3-dispatch';

import type {PreparedYAxis} from '~core/axes/types';
import * as seriesRegistry from '~core/series/seriesRegistry';

import type {PreparedTooltip} from '../../../hooks/types';
import {useTooltip} from '../../../hooks/useTooltip';
import type {ChartYAxis, TooltipDataChunk, TooltipDataChunkLine} from '../../../types';
import {ChartTooltipContent, TooltipContent} from '../ChartTooltipContent';

function makeChunk(name: string, y: number, yAxis: number): TooltipDataChunkLine {
    const series = {type: 'line' as const, id: name, name, yAxis};
    return {data: {x: 0, y}, series};
}

afterEach(() => jest.restoreAllMocks());

it.each([true, false])(
    'preserves all Y axes when a custom renderer reuses default content (legacy axis: %s)',
    (includeLegacyAxis) => {
        const hovered = [makeChunk('Primary', 10, 0), makeChunk('Secondary', 1, 1)];
        const yAxes: ChartYAxis[] = [
            {type: 'linear'},
            {type: 'category', categories: ['First', 'Second']},
        ];
        const formatter = jest.fn(({value}) => String(value));
        render(
            <ThemeProvider theme="light">
                <TooltipContent
                    hovered={hovered}
                    yAxis={includeLegacyAxis ? yAxes[0] : undefined}
                    yAxes={yAxes}
                    renderer={(args) => (
                        <ChartTooltipContent
                            {...args}
                            totals={{enabled: true, valueFormat: {type: 'custom', formatter}}}
                        />
                    )}
                />
            </ThemeProvider>,
        );
        expect(formatter).toHaveBeenCalledWith({value: 10});
    },
);

it.each(['bar-y', 'x-range'] as const)(
    'preserves the supplied Y axes when a custom renderer reuses the %s header',
    (type) => {
        const hovered: TooltipDataChunk[] = [
            type === 'bar-y'
                ? {data: {x: 10, y: 1}, series: {type, name: 'Series', data: []}}
                : {
                      data: {x0: 10, x1: 20, y: 1},
                      series: {type, name: 'Series', data: []},
                  },
        ];
        const yAxes: ChartYAxis[] = [
            {type: 'category', categories: ['First', 'Header']},
            {type: 'category', categories: ['First', 'Secondary']},
        ];
        const formatter = jest.fn(({value}) => String(value));
        render(
            <ThemeProvider theme="light">
                <TooltipContent
                    hovered={hovered}
                    yAxes={yAxes}
                    headerFormat={{type: 'custom', formatter}}
                    renderer={(args) => <ChartTooltipContent {...args} />}
                />
            </ThemeProvider>,
        );
        expect(formatter).toHaveBeenCalledWith({value: 'Header'});
        expect(screen.getByText('Header')).toBeTruthy();
    },
);

it('uses an explicit empty Y axes array instead of falling back to the legacy axis', () => {
    const hovered = [makeChunk('Primary', 10, 0), makeChunk('Secondary', 1, 1)];
    const formatter = jest.fn(({value}) => String(value));
    render(
        <ThemeProvider theme="light">
            <ChartTooltipContent
                hovered={hovered}
                yAxis={{type: 'category', categories: ['First', 'Second']}}
                yAxes={[]}
                totals={{enabled: true, valueFormat: {type: 'custom', formatter}}}
            />
        </ThemeProvider>,
    );
    expect(formatter).toHaveBeenCalledWith({value: 11});
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
                    <ChartTooltipContent
                        {...args}
                        yAxis={customAxis}
                        yAxes={undefined}
                        totals={totals}
                    />
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
    const {result} = renderHook(() =>
        useTooltip({dispatcher, tooltip, yAxis, seriesData: undefined}),
    );
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
