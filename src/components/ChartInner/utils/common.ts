import React from 'react';

import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';

import type {PreparedAxis, PreparedSeries} from '../../../hooks';
import type {PreparedZoom} from '../../../hooks/types';

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

export function useAsyncState<T>(
    value: T,
    prepare: () => Promise<T>,
    isReady = true,
    onError?: (error: unknown) => void,
) {
    const [result, setResult] = React.useState<{value: T; prepare?: typeof prepare}>({value});
    React.useEffect(() => {
        let cancelled = false;
        if (isReady) {
            prepare().then(
                (nextValue) => {
                    if (!cancelled) {
                        setResult((current) => ({
                            value: isEqual(current.value, nextValue) ? current.value : nextValue,
                            prepare,
                        }));
                    }
                },
                (error: unknown) => {
                    if (!cancelled) {
                        if (onError) {
                            onError(error);
                        } else {
                            throw error;
                        }
                    }
                },
            );
        }
        return () => {
            cancelled = true;
        };
    }, [prepare, isReady, onError]);

    return {value: result.value, isReady: isReady && result.prepare === prepare};
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
                    style.top = boundsHeight - (node?.clientHeight || 0) + (titleHeight || 0);
                    break;
                }
                case 'top-left': {
                    style.left = boundsOffsetLeft;
                    style.top = boundsOffsetTop;
                    break;
                }
                case 'top-right': {
                    style.left = boundsWidth + boundsOffsetLeft - (node?.clientWidth || 0);
                    style.top = boundsOffsetTop;
                    break;
                }
            }
            break;
        }
    }

    return style;
}

export function useDebouncedValue<T>(props: {value: T; delay?: number}) {
    const {value: propsValue, delay = 0} = props;
    const [value, setValue] = React.useState<T>(propsValue);

    React.useEffect(() => {
        const debouncedSetValue = debounce(setValue, delay);
        debouncedSetValue(propsValue);

        return () => {
            debouncedSetValue.cancel();
        };
    }, [propsValue, delay]);

    return value;
}
