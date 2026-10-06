/* @jest-environment jsdom */

import {act, renderHook} from '@testing-library/react';

import type {PreparedSeries} from '~core/series/types';
import {getDispatcher} from '~core/utils/dispatcher';

import type {PointPosition, TooltipDataChunkBarY} from '../../../types';
import type {PreparedTooltip} from '../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../useAxis/types';
import {useTooltip} from '../index';

interface AxisProps {
    seriesData: PreparedSeries[];
    xAxis?: PreparedXAxis | null;
    yAxis?: PreparedYAxis[];
}

function setup() {
    const dispatcher = getDispatcher();
    const tooltip: PreparedTooltip = {
        enabled: true,
        throttle: 0,
        sorting: {key: 'value', direction: 'asc'},
    };
    const xAxis = {type: 'category', categories: ['A', 'B']} as PreparedXAxis;
    const yAxis = {type: 'category', categories: ['A', 'B']} as PreparedYAxis;
    const axes: AxisProps = {xAxis, yAxis: [yAxis], seriesData: []};
    const view = renderHook((props: AxisProps) => useTooltip({dispatcher, tooltip, ...props}), {
        initialProps: axes,
    });
    const hovered: TooltipDataChunkBarY[] = [
        {data: {x: 1, y: 1}, series: {type: 'bar-y', name: 'Series', data: []}},
    ];
    const pointerPosition: PointPosition = [10, 20];
    const hover = (nextHovered = hovered) => {
        act(() =>
            dispatcher.call('hover-shape', undefined, nextHovered, pointerPosition, {
                bands: [],
                lines: [],
                shapes: [],
            }),
        );
    };
    hover();
    expect(view.result.current.hovered).toEqual(hovered);
    return {...view, axes, hovered, hover, pointerPosition};
}

it('clears hover when source series are replaced without changing axes', () => {
    const {result, rerender, axes, hover, hovered} = setup();
    rerender({...axes, seriesData: []});
    expect(result.current.hovered).toBeUndefined();
    expect(result.current.pointerPosition).toBeUndefined();
    hover();
    expect(result.current.hovered).toEqual(hovered);
});

describe.each(['xAxis', 'yAxis'] as const)('hover state on %s updates', (axisKey) => {
    const updateAxis = (axes: AxisProps, changes: Partial<PreparedXAxis>) => {
        const axis = axisKey === 'yAxis' ? axes.yAxis?.[0] : axes.xAxis;
        const updatedAxis = {...axis, ...changes};
        return {...axes, [axisKey]: axisKey === 'yAxis' ? [updatedAxis] : updatedAxis};
    };

    it('preserves hover across layout/range changes and equivalent category arrays', () => {
        const {result, rerender, axes, pointerPosition, hover} = setup();
        const previousHovered = result.current.hovered;
        rerender(updateAxis(axes, {min: 1, max: 5, categories: ['A', 'B']}));
        expect(result.current.hovered).toBe(previousHovered);
        expect(result.current.pointerPosition).toEqual(pointerPosition);
        hover();
        expect(result.current.hovered).toBe(previousHovered);
    });

    it.each([{categories: ['A']}, {categories: ['C', 'D']}, {categories: ['B', 'A']}])(
        'clears stale hover when categories become $categories',
        ({categories}) => {
            const {result, rerender, axes, hovered, hover} = setup();
            rerender(updateAxis(axes, {categories}));
            expect(result.current.hovered).toBeUndefined();
            expect(result.current.pointerPosition).toBeUndefined();
            expect(result.current.hoveredPlotBands).toBeUndefined();
            expect(result.current.hoveredPlotLines).toBeUndefined();
            expect(result.current.hoveredPlotShapes).toBeUndefined();

            // The next hover event must recover even when its point equals the previous one.
            hover();
            expect(result.current.hovered).toEqual(hovered);
            hover([]);
            expect(result.current.hovered).toEqual([]);
        },
    );

    it('clears hover when the axis type changes', () => {
        const {result, rerender, axes} = setup();
        rerender(updateAxis(axes, {type: 'linear'}));
        expect(result.current.hovered).toBeUndefined();
    });

    it('clears category hover when the axis is removed', () => {
        const {result, rerender, axes} = setup();
        rerender({...axes, [axisKey]: undefined});
        expect(result.current.hovered).toBeUndefined();
    });

    it('ignores categories on a continuous axis', () => {
        const {result, rerender, axes, hover} = setup();
        const continuousAxes = updateAxis(axes, {type: 'linear'});
        rerender(continuousAxes);
        hover();
        const previousHovered = result.current.hovered;
        rerender(updateAxis(continuousAxes, {categories: ['C', 'D']}));
        expect(result.current.hovered).toBe(previousHovered);
    });
});
