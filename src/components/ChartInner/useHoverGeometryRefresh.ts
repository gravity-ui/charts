import React from 'react';

import type {Dispatch} from 'd3-dispatch';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';

import type {PreparedXAxis, PreparedYAxis} from '~core/axes/types';
import type {ChartScale} from '~core/scales/types';
import type {TooltipItemData} from '~core/shapes/types';
import {EventType} from '~core/utils';
import {getClosestPoints} from '~core/utils/get-closest-data';
import {getHoveredPlots} from '~core/utils/get-hovered-plots';

import type {useHoverResetKey} from '../../hooks/useHoverResetKey';
import type {PointPosition, TooltipDataChunk} from '../../types';

interface Props {
    resetKey: ReturnType<typeof useHoverResetKey>;
    dispatcher: Dispatch<object>;
    shapesData: TooltipItemData[];
    boundsWidth: number;
    boundsHeight: number;
    boundsOffsetLeft: number;
    boundsOffsetTop: number;
    xAxis: PreparedXAxis | null;
    yAxis: PreparedYAxis[];
    xScale?: ChartScale;
    yScale?: (ChartScale | undefined)[];
    tooltipPinned: boolean;
    unpinTooltip?: () => void;
}

interface HoverState {
    resetKey: Props['resetKey'];
    chunks?: TooltipDataChunk[];
    position?: PointPosition;
}

function isSamePoint(previous: TooltipDataChunk, current: TooltipDataChunk) {
    if (previous.data === current.data) {
        return true;
    }

    const previousData = get(previous.series, 'data', []);
    const currentData = get(current.series, 'data', []);
    if (!Array.isArray(previousData) || !Array.isArray(currentData)) {
        return false;
    }

    const previousIndex = previousData.findIndex((point) => point === previous.data);
    return (
        previousIndex >= 0 &&
        previousIndex === currentData.findIndex((point) => point === current.data) &&
        isEqual(previous.data, current.data)
    );
}

export function useHoverGeometryRefresh({
    resetKey,
    dispatcher,
    shapesData,
    boundsWidth,
    boundsHeight,
    boundsOffsetLeft,
    boundsOffsetTop,
    xAxis,
    yAxis,
    xScale,
    yScale,
    tooltipPinned,
    unpinTooltip,
}: Props) {
    const hoverRef = React.useRef<HoverState>();
    const geometryRef = React.useRef({shapesData, resetKey});

    React.useEffect(() => {
        dispatcher.on(
            `${EventType.HOVER_SHAPE}.geometry-refresh`,
            (chunks?: TooltipDataChunk[], position?: PointPosition) => {
                hoverRef.current = {resetKey, chunks, position};
            },
        );
        return () => {
            dispatcher.on(`${EventType.HOVER_SHAPE}.geometry-refresh`, null);
        };
    }, [dispatcher, resetKey]);

    React.useEffect(() => {
        const sourceChanged = geometryRef.current.resetKey !== resetKey;
        const emptyBounds = boundsWidth <= 0 || boundsHeight <= 0;
        if (sourceChanged || emptyBounds) {
            geometryRef.current = {shapesData, resetKey};
            const hadHover = Boolean(hoverRef.current?.chunks?.length);
            hoverRef.current = undefined;
            if (tooltipPinned) {
                unpinTooltip?.();
            }
            if (hadHover) {
                dispatcher.call(EventType.HOVER_SHAPE, undefined, undefined);
            }
            return undefined;
        }
        if (geometryRef.current.shapesData === shapesData) {
            return undefined;
        }

        let cancelled = false;
        queueMicrotask(() => {
            if (cancelled) {
                return;
            }
            geometryRef.current = {shapesData, resetKey};
            const previous = hoverRef.current;
            if (!previous?.position || previous.resetKey !== resetKey) {
                if (tooltipPinned) {
                    unpinTooltip?.();
                }
                return;
            }

            const x = previous.position[0] - boundsOffsetLeft;
            const y = previous.position[1] - boundsOffsetTop;
            if (x < 0 || x > boundsWidth || y < 0 || y > boundsHeight) {
                if (tooltipPinned) {
                    unpinTooltip?.();
                }
                dispatcher.call(EventType.HOVER_SHAPE, undefined, undefined);
                return;
            }

            const chunks = getClosestPoints({
                position: [x, y],
                shapesData,
                boundsWidth,
                boundsHeight,
            });
            if (tooltipPinned) {
                const previousSelected = previous.chunks?.find((chunk) => chunk.closest);
                const selected = chunks.find((chunk) => chunk.closest);
                if (
                    !previousSelected ||
                    !selected ||
                    get(previousSelected.series, 'id') !== get(selected.series, 'id') ||
                    !isSamePoint(previousSelected, selected)
                ) {
                    unpinTooltip?.();
                    dispatcher.call(EventType.HOVER_SHAPE, undefined, undefined);
                    return;
                }
            }

            const {plotBands, plotLines, plotShapes} = getHoveredPlots({
                pointerX: x,
                pointerY: y,
                xAxis,
                yAxis,
                xScale,
                yScale,
            });
            dispatcher.call(EventType.HOVER_SHAPE, undefined, chunks, previous.position, {
                bands: plotBands,
                lines: plotLines,
                shapes: plotShapes,
            });
        });

        return () => {
            cancelled = true;
        };
    }, [
        resetKey,
        dispatcher,
        shapesData,
        boundsWidth,
        boundsHeight,
        boundsOffsetLeft,
        boundsOffsetTop,
        xAxis,
        yAxis,
        xScale,
        yScale,
        tooltipPinned,
        unpinTooltip,
    ]);
}
