import React from 'react';

import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';

import type {PreparedSeries} from '../../hooks';
import type {PreparedAxis} from '../../hooks/useChartOptions/types';

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
