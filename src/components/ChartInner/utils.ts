import type {PreparedAxis} from '../../hooks/useChartOptions/types';
import type {ChartSeries} from '../../types';

export function hasAtLeastOneSeriesDataPerPlot(
    seriesData: ChartSeries[],
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
            if (seriesDataChunk.data.length > 0) {
                hasDataMap.set(plotIndex, true);
            }
        }
    });

    return [...hasDataMap.values()].every((hasData) => hasData);
}
