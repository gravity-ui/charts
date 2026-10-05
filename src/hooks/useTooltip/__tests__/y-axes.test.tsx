/** @jest-environment jsdom */
import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {act, render, renderHook} from '@testing-library/react';
import {dispatch} from 'd3-dispatch';

import type {PreparedYAxis} from '~core/axes/types';

import {ChartTooltipContent} from '../../../components/Tooltip/ChartTooltipContent';
import {TooltipAxesContext} from '../../../components/Tooltip/TooltipAxesContext';
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
    rerender({dispatcher, tooltip, yAxis: [yAxis[0], {...yAxis[1], categories: ['Only']}]});
    expect(result.current.hovered).toBeUndefined();
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
            <TooltipAxesContext.Provider value={yAxes}>
                <ChartTooltipContent
                    hovered={hovered}
                    yAxis={yAxes[0]}
                    renderer={renderer}
                    totals={{enabled: true, valueFormat: {type: 'custom', formatter}}}
                />
            </TooltipAxesContext.Provider>
        </ThemeProvider>,
    );
    expect(formatter).toHaveBeenCalledWith({value: 10});
    expect(renderer).toHaveBeenCalledWith(expect.objectContaining({hovered, yAxis: yAxes[0]}));
});
