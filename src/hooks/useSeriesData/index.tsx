import React from 'react';

import type {ChartSeries, ChartXAxis, ChartYAxis} from '../../types';
import {getZoomedSeriesData} from '../hooks-utils';
import type {ZoomState} from '../useZoom/types';

interface UseSeriesDataProps {
    seriesData: ChartSeries[];
    zoomState: Partial<ZoomState>;
    xAxis?: ChartXAxis;
    yAxises?: ChartYAxis[];
}

// TODO: remove
export function useSeriesData(props: UseSeriesDataProps) {
    const {seriesData, xAxis, yAxises, zoomState} = props;
    const zoomedSeriesData = React.useMemo(() => {
        return getZoomedSeriesData({
            seriesData,
            xAxis,
            yAxises,
            zoomState,
        });
    }, [seriesData, xAxis, yAxises, zoomState]);

    return {seriesData: zoomedSeriesData};
}
