import type React from 'react';

import {pointer} from 'd3';
import type {Dispatch} from 'd3';
import throttle from 'lodash/throttle';

import {IS_TOUCH_ENABLED} from '../../constants';
import type {PreparedAxis, ShapeData} from '../../hooks';
import type {ChartTooltipRendererArgs, ChartYAxis, PointPosition} from '../../types';
import {EventType} from '../../utils';
import {getClosestPoints} from '../../utils/chart/get-closest-data';

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
    xAxis: PreparedAxis | null;
    yAxis: PreparedAxis[];
    tooltipThrottle: number;
    isOutsideBounds: (x: number, y: number) => boolean;
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
        tooltipThrottle,
        isOutsideBounds,
    } = props;

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

        const closest = getClosestPoints({
            position: [x, y],
            shapesData,
            boundsHeight,
            boundsWidth,
        });
        dispatcher.call(EventType.HOVER_SHAPE, event.target, closest, [pointerX, pointerY]);
        dispatcher.call(
            EventType.POINTERMOVE_CHART,
            {},
            {
                hovered: closest,
                xAxis,
                yAxis: yAxis[0] as ChartYAxis,
            } satisfies ChartTooltipRendererArgs,
            event,
        );
    };

    const handleMouseMove: React.MouseEventHandler<SVGSVGElement> = (event) => {
        const [pointerX, pointerY] = pointer(event, svgContainer);
        handleMove([pointerX, pointerY], event);
    };

    const throttledHandleMouseMove = IS_TOUCH_ENABLED
        ? undefined
        : throttle(handleMouseMove, tooltipThrottle);

    const handleMouseLeave: React.MouseEventHandler<SVGSVGElement> = (event) => {
        if (tooltipPinned) {
            return;
        }

        throttledHandleMouseMove?.cancel();
        dispatcher.call(EventType.HOVER_SHAPE, {}, undefined);
        dispatcher.call(EventType.POINTERMOVE_CHART, {}, undefined, event);
    };

    const handleTouchMove: React.TouchEventHandler<SVGSVGElement> = (event) => {
        const touch = event.touches[0];
        const [pointerX, pointerY] = pointer(touch, svgContainer);
        handleMove([pointerX, pointerY], event);
    };

    const throttledHandleTouchMove = IS_TOUCH_ENABLED
        ? throttle(handleTouchMove, tooltipThrottle)
        : undefined;

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
            dispatcher.call(EventType.HOVER_SHAPE, event.target, items, [pointerX, pointerY]);
            dispatcher.call(
                EventType.POINTERMOVE_CHART,
                {},
                {
                    hovered: items,
                    xAxis,
                    yAxis: yAxis[0] as ChartYAxis,
                } satisfies ChartTooltipRendererArgs,
                event,
            );
        }

        togglePinTooltip?.(nextTooltipFixed, event);
    };

    return {
        handleChartClick,
        handleMouseLeave,
        throttledHandleMouseMove,
        throttledHandleTouchMove,
    };
}
