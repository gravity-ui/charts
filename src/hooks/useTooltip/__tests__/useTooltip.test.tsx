/** @jest-environment jsdom */

import {act, renderHook} from '@testing-library/react';

import {getDispatcher} from '~core/utils/dispatcher';

import type {TooltipDataChunkBarY} from '../../../types';
import type {PreparedTooltip} from '../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../useAxis/types';
import {useTooltip} from '../index';

it.each(['x', 'y'] as const)('preserves hover state when the %s axis changes', (direction) => {
    const dispatcher = getDispatcher();
    const tooltip: PreparedTooltip = {
        enabled: true,
        throttle: 0,
        sorting: {key: 'value', direction: 'asc'},
    };
    const initialProps = {
        xAxis: {type: 'category', categories: ['A', 'B']} as PreparedXAxis,
        yAxis: {type: 'category', categories: ['A', 'B']} as PreparedYAxis,
    };
    const {result, rerender} = renderHook((axes) => useTooltip({dispatcher, tooltip, ...axes}), {
        initialProps,
    });
    const hovered: TooltipDataChunkBarY[] = [
        {data: {x: 1, y: 1}, series: {type: 'bar-y', name: 'Series', data: []}},
    ];
    const pointerPosition = {x: 10, y: 20};
    act(() => dispatcher.call('hover-shape', undefined, hovered, pointerPosition));
    expect(result.current.hovered).toEqual(hovered);

    rerender({
        ...initialProps,
        [direction === 'x' ? 'xAxis' : 'yAxis']: {
            ...initialProps[direction === 'x' ? 'xAxis' : 'yAxis'],
            categories: ['A'],
        },
    });
    expect(result.current.hovered).toEqual(hovered);
    expect(result.current.pointerPosition).toEqual(pointerPosition);

    // The next event must also tolerate indices left over from the previous axes.
    act(() => dispatcher.call('hover-shape', undefined, hovered, pointerPosition));
    expect(result.current.hovered).toEqual(hovered);
    act(() => dispatcher.call('hover-shape', undefined, []));
    expect(result.current.hovered).toEqual([]);
});
