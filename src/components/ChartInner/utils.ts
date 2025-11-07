import React from 'react';

import isEqual from 'lodash/isEqual';

import type {PreparedSeries} from '../../hooks';
import type {PreparedAxis, PreparedZoom} from '../../hooks/useChartOptions/types';

export function hasAtLeastOneSeriesDataPerPlot(
    seriesData: PreparedSeries[],
    yAxes: PreparedAxis[] = [],
) {
    const hasDataMap = new Map<number, boolean>();
    yAxes.forEach((yAxis) => {
        const plotIndex = yAxis.plotIndex ?? 0;
        if (!hasDataMap.has(plotIndex)) {
            hasDataMap.set(plotIndex, false);
        }
    });

    if (hasDataMap.size === 0) {
        return false;
    }

    seriesData.forEach((seriesDataChunk) => {
        let yAxisIndex = 0;

        if ('yAxis' in seriesDataChunk && typeof seriesDataChunk.yAxis === 'number') {
            yAxisIndex = seriesDataChunk.yAxis;
        }

        const yAxis = yAxes[yAxisIndex];
        const plotIndex = yAxis?.plotIndex ?? 0;

        if (!hasDataMap.get(plotIndex)) {
            if (Array.isArray(seriesDataChunk.data) && seriesDataChunk.data.length > 0) {
                hasDataMap.set(plotIndex, true);
            }
        }
    });

    return [...hasDataMap.values()].every((hasData) => hasData);
}

export function useAsyncState<T>(value: T, setState: () => Promise<T>) {
    const [stateValue, setValue] = React.useState<T>(value);
    const countedRef = React.useRef(0);
    const prevValue = React.useRef(value);
    const ready = React.useRef(false);
    React.useEffect(() => {
        countedRef.current++;
        (async function () {
            const currentRun = countedRef.current;
            const newValue = await setState();

            ready.current = true;
            if (countedRef.current === currentRun && !isEqual(prevValue.current, newValue)) {
                setValue(newValue);
                prevValue.current = newValue;
            }
        })();
    }, [setState]);

    return stateValue;
}

export function getResetZoomButtonStyle(
    args: {
        boundsHeight: number;
        boundsOffsetLeft: number;
        boundsOffsetTop: number;
        boundsWidth: number;
        node: HTMLElement | null;
        titleHeight?: number;
    } & PreparedZoom['resetButton'],
) {
    const {
        align,
        boundsHeight,
        boundsOffsetLeft,
        boundsOffsetTop,
        boundsWidth,
        node,
        offset,
        relativeTo,
        titleHeight,
    } = args;
    const style: React.CSSProperties = {
        position: 'absolute',
        transform: `translate(${offset.x}px, ${offset.y}px)`,
    };

    switch (relativeTo) {
        case 'chart-box': {
            switch (align) {
                case 'bottom-left': {
                    style.bottom = 0;
                    style.left = 0;
                    break;
                }
                case 'bottom-right': {
                    style.bottom = 0;
                    style.right = 0;
                    break;
                }
                case 'top-left': {
                    style.top = 0;
                    style.left = 0;
                    break;
                }
                case 'top-right': {
                    style.top = 0;
                    style.right = 0;
                    break;
                }
            }
            break;
        }

        case 'plot-box': {
            switch (align) {
                case 'bottom-left': {
                    style.left = boundsOffsetLeft;
                    style.top = boundsHeight - (node?.clientHeight || 0) + (titleHeight || 0);
                    break;
                }
                case 'bottom-right': {
                    style.left = boundsWidth + boundsOffsetLeft - (node?.clientWidth || 0);
                    style.top = boundsOffsetTop;
                    break;
                }
                case 'top-left': {
                    style.left = boundsOffsetLeft;
                    style.top = boundsOffsetTop;
                    break;
                }
                case 'top-right': {
                    style.left = boundsWidth + boundsOffsetLeft - (node?.clientWidth || 0);
                    style.top = boundsHeight - (node?.clientHeight || 0) + (titleHeight || 0);
                    break;
                }
            }
            break;
        }
    }

    return style;
}
