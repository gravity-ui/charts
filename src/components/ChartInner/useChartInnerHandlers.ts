import React from 'react';

import type {Dispatch} from 'd3-dispatch';
import {pointer} from 'd3-selection';
import get from 'lodash/get';
import throttle from 'lodash/throttle';

import type {ChartScale} from '~core/scales/types';
import {EventType} from '~core/utils';
import {getClosestPoints} from '~core/utils/get-closest-data';
import {getHoveredPlots} from '~core/utils/get-hovered-plots';

import type {PreparedXAxis, PreparedYAxis, ShapeData} from '../../hooks';
import type {ChartTooltipRendererArgs, ChartYAxis, PointPosition} from '../../types';

import type {useChartInnerState} from './useChartInnerState';

type ChartInnerState = ReturnType<typeof useChartInnerState>;

type Props = {
    boundsHeight: number;
    boundsOffsetLeft: number;
    boundsOffsetTop: number;
    boundsWidth: number;
    dispatcher: Dispatch<object>;
    shapesData: ShapeData[];
    svgContainer: SVGSVGElement | null;
    togglePinTooltip: ChartInnerState['togglePinTooltip'];
    tooltipPinned: boolean;
    unpinTooltip: ChartInnerState['unpinTooltip'];
    xAxis: PreparedXAxis | null;
    yAxis: PreparedYAxis[];
    xScale?: ChartScale;
    yScale?: (ChartScale | undefined)[];
    tooltipThrottle: number;
};

export function useChartInnerHandlers(props: Props) {
    const {
        boundsHeight,
        boundsOffsetLeft,
        boundsOffsetTop,
        boundsWidth,
        dispatcher,
        shapesData,
        svgContainer,
        togglePinTooltip,
        tooltipPinned,
        unpinTooltip,
        xAxis,
        yAxis,
        xScale,
        yScale,
        tooltipThrottle,
    } = props;

    const isOutsideBounds = React.useCallback(
        (x: number, y: number) => {
            return x < 0 || x > boundsWidth || y < 0 || y > boundsHeight;
        },
        [boundsHeight, boundsWidth],
    );

    const handleMove = (
        [pointerX, pointerY]: PointPosition,
        event: React.MouseEvent | React.TouchEvent,
    ) => {
        if (tooltipPinned) {
            return;
        }

        const x = pointerX - boundsOffsetLeft;
        const y = pointerY - boundsOffsetTop;
        if (isOutsideBounds(x, y)) {
            dispatcher.call(EventType.HOVER_SHAPE, {}, undefined);
            dispatcher.call(EventType.POINTERMOVE_CHART, {}, undefined, event);
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
        const {plotBands, plotLines, plotShapes} = getHoveredPlots({
            pointerX: x,
            pointerY: y,
            xAxis,
            yAxis,
            xScale,
            yScale,
        });
        const hoveredPlotsArg = {bands: plotBands, lines: plotLines, shapes: plotShapes};
        dispatcher.call(
            EventType.HOVER_SHAPE,
            event.target,
            closest,
            [pointerX, pointerY],
            hoveredPlotsArg,
        );
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
            event,
        );
    };

    const handlePointerMove: React.PointerEventHandler<SVGSVGElement> = (event) => {
        if (event.pointerType === 'touch') {
            return;
        }

        const [pointerX, pointerY] = pointer(event, svgContainer);
        handleMove([pointerX, pointerY], event);
    };

    const throttledHandlePointerMove = throttle(handlePointerMove, tooltipThrottle);

    const handlePointerLeave: React.PointerEventHandler<SVGSVGElement> = (event) => {
        if (tooltipPinned) {
            return;
        }

        throttledHandlePointerMove.cancel();
        dispatcher.call(EventType.HOVER_SHAPE, {}, undefined);
        dispatcher.call(EventType.POINTERMOVE_CHART, {}, undefined, event);
    };

    const handleTouchMove: React.TouchEventHandler<SVGSVGElement> = (event) => {
        const touch = event.touches[0];
        const [pointerX, pointerY] = pointer(touch, svgContainer);
        handleMove([pointerX, pointerY], event);
    };

    const throttledHandleTouchMove = throttle(handleTouchMove, tooltipThrottle);

    const handleChartClick = (event: React.MouseEvent<SVGSVGElement>) => {
        const [pointerX, pointerY] = pointer(event, svgContainer);
        const x = pointerX - boundsOffsetLeft;
        const y = pointerY - boundsOffsetTop;

        if (isOutsideBounds(x, y)) {
            return;
        }

        const items = getClosestPoints({
            position: [x, y],
            shapesData,
            boundsHeight,
            boundsWidth,
        });
        const selected = items?.find((item) => item.closest);
        if (!selected) {
            if (tooltipPinned) {
                unpinTooltip?.();
            }

            return;
        }

        dispatcher.call(
            EventType.CLICK_CHART,
            undefined,
            {point: selected.data, series: selected.series},
            event,
        );

        const nextTooltipFixed = !tooltipPinned;

        if (!nextTooltipFixed) {
            const {plotBands, plotLines, plotShapes} = getHoveredPlots({
                pointerX: x,
                pointerY: y,
                xAxis,
                yAxis,
                xScale,
                yScale,
            });
            const hoveredPlotsArg = {bands: plotBands, lines: plotLines, shapes: plotShapes};
            dispatcher.call(
                EventType.HOVER_SHAPE,
                event.target,
                items,
                [pointerX, pointerY],
                hoveredPlotsArg,
            );
            dispatcher.call(
                EventType.POINTERMOVE_CHART,
                {},
                {
                    hovered: items,
                    xAxis,
                    yAxis: yAxis[0] as ChartYAxis,
                    hoveredPlotBands: plotBands,
                    hoveredPlotLines: plotLines,
                    hoveredPlotShapes: plotShapes,
                } satisfies ChartTooltipRendererArgs,
                event,
            );
        }

        togglePinTooltip?.(nextTooltipFixed, event);
    };

    return {
        handleChartClick,
        handlePointerLeave,
        throttledHandlePointerMove,
        throttledHandleTouchMove,
    };
}
