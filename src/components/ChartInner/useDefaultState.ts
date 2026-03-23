import React from 'react';

import type {Dispatch} from 'd3-dispatch';
import get from 'lodash/get';

import type {ChartScale} from '~core/scales/types';
import {EventType} from '~core/utils';
import {getClosestPoints} from '~core/utils/get-closest-data';
import {getHoveredPlots} from '~core/utils/get-hovered-plots';
import {calculateNumericProperty} from '~core/utils/math';

import type {PreparedXAxis, PreparedYAxis, ShapeData} from '../../hooks';
import type {ChartTooltipRendererArgs, ChartYAxis} from '../../types';

type Props = {
    boundsHeight: number;
    boundsOffsetLeft: number;
    boundsOffsetTop: number;
    boundsWidth: number;
    defaultState?: {hoveredPosition?: {x: number | string; y: number | string}};
    dispatcher: Dispatch<object>;
    shapesData: ShapeData[];
    shapesReady: boolean;
    svgRef: React.RefObject<SVGSVGElement | null>;
    xAxis: PreparedXAxis | null;
    yAxis: PreparedYAxis[];
    xScale?: ChartScale;
    yScale?: (ChartScale | undefined)[];
};

export function useDefaultState(props: Props) {
    const {
        boundsHeight,
        boundsOffsetLeft,
        boundsOffsetTop,
        boundsWidth,
        defaultState,
        dispatcher,
        shapesData,
        shapesReady,
        svgRef,
        xAxis,
        yAxis,
        xScale,
        yScale,
    } = props;

    const appliedRef = React.useRef(false);

    React.useEffect(() => {
        const hoveredPosition = defaultState?.hoveredPosition;

        if (appliedRef.current || !shapesReady || !hoveredPosition) {
            return;
        }

        appliedRef.current = true;

        // Defer dispatch so shape components (Area, Line, etc.) register their hover-shape.*
        // listeners first; parent effects run before child effects in React.
        queueMicrotask(() => {
            const x = calculateNumericProperty({value: hoveredPosition.x, base: boundsWidth});
            const y = calculateNumericProperty({value: hoveredPosition.y, base: boundsHeight});

            if (x === undefined || y === undefined) {
                return;
            }

            const shapesDataWithTooltipEnabled = shapesData.filter((d) =>
                get(d, 'series.tooltip.enabled', true),
            );

            const closest = getClosestPoints({
                position: [x, y],
                shapesData: shapesDataWithTooltipEnabled,
                boundsHeight,
                boundsWidth,
            });

            const {plotLines, plotBands} = getHoveredPlots({
                pointerX: x,
                pointerY: y,
                xAxis,
                yAxis,
                xScale,
                yScale,
            });

            const hoveredPlotsArg = {lines: plotLines, bands: plotBands};
            const svgPointerX = x + boundsOffsetLeft;
            const svgPointerY = y + boundsOffsetTop;

            dispatcher.call(
                EventType.HOVER_SHAPE,
                undefined,
                closest,
                [svgPointerX, svgPointerY],
                hoveredPlotsArg,
            );

            const rect = svgRef.current?.getBoundingClientRect();
            const syntheticEvent =
                rect &&
                new PointerEvent('pointermove', {
                    bubbles: true,
                    clientX: rect.left + svgPointerX,
                    clientY: rect.top + svgPointerY,
                });

            if (syntheticEvent) {
                svgRef.current?.dispatchEvent(syntheticEvent);
            }

            dispatcher.call(
                EventType.POINTERMOVE_CHART,
                {},
                {
                    hovered: closest,
                    xAxis,
                    yAxis: yAxis[0] as ChartYAxis,
                    hoveredPlotLines: plotLines,
                    hoveredPlotBands: plotBands,
                } satisfies ChartTooltipRendererArgs,
                syntheticEvent,
            );
        });
    }, [
        boundsHeight,
        boundsOffsetLeft,
        boundsOffsetTop,
        boundsWidth,
        defaultState,
        dispatcher,
        shapesData,
        shapesReady,
        svgRef,
        xAxis,
        xScale,
        yAxis,
        yScale,
    ]);
}
