/* @jest-environment jsdom */
import {act, renderHook} from '@testing-library/react';
import {dispatch} from 'd3-dispatch';

import type {PreparedYAxis} from '~core/axes/types';

import type {TooltipDataChunkLine} from '../../../types';
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
        initialProps: {dispatcher, tooltip, yAxis, seriesData: undefined},
    });
    act(() => dispatcher.call('hover-shape', undefined, hovered, [10, 20]));
    expect(result.current.hovered).toEqual([hovered[1], hovered[0]]);
    expect(result.current.hoveredValues).toEqual(['Ant', 'Zebra']);
    rerender({
        dispatcher,
        tooltip,
        yAxis: [yAxis[0], {...yAxis[1], categories: ['Only']}],
        seriesData: undefined,
    });
    expect(result.current.hovered).toBeUndefined();
    expect(result.current.hoveredValues).toBeUndefined();
});
