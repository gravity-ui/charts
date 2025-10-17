import type {ChartScale} from '../../useAxisScales';
import type {PreparedAxis} from '../../useChartOptions/types';
import type {PreparedHeatmapSeries, PreparedSeriesOptions} from '../../useSeries/types';

import type {HeatMapItem, PreparedHeatmapData} from './types';

type PrepareHeatmapDataArgs = {
    series: PreparedHeatmapSeries;
    seriesOptions: PreparedSeriesOptions;
    xAxis: PreparedAxis;
    xScale: ChartScale;
    yAxis: PreparedAxis[];
    yScale: ChartScale[];
};

export function prepareHeatmapData({series}: PrepareHeatmapDataArgs) {
    const preparedData: PreparedHeatmapData = {
        htmlElements: [],
        items: series.data.map(() => {
            const item: HeatMapItem = {
                x: 0,
                y: 0,
                color: '',
                width: 0,
                height: 0,
            };

            return item;
        }),
    };

    return preparedData;
}
