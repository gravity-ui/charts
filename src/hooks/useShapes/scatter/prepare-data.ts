import get from 'lodash/get';

import type {ScatterSeriesData} from '../../../types';
import type {ChartScale} from '../../useAxisScales';
import type {PreparedAxis} from '../../useChartOptions/types';
import type {PreparedScatterSeries} from '../../useSeries/types';
import {getXValue, getYValue} from '../utils';

import type {PreparedScatterData} from './types';

const getFilteredLinearScatterData = (data: ScatterSeriesData[]) => {
    return data.filter((d) => typeof d.x === 'number' && typeof d.y === 'number');
};

export const prepareScatterData = (args: {
    series: PreparedScatterSeries[];
    xAxis: PreparedAxis;
    xScale: ChartScale;
    yAxis: PreparedAxis[];
    yScale: ChartScale[];
}): PreparedScatterData[] => {
    const {series, xAxis, xScale, yAxis, yScale} = args;

    return series.reduce<PreparedScatterData[]>((acc, s) => {
        const yAxisIndex = get(s, 'yAxis', 0);
        const seriesYAxis = yAxis[yAxisIndex];
        const seriesYScale = yScale[yAxisIndex];
        const filteredData =
            xAxis.type === 'category' || seriesYAxis.type === 'category'
                ? s.data
                : getFilteredLinearScatterData(s.data);

        filteredData.forEach((d) => {
            acc.push({
                point: {
                    data: d,
                    series: s,
                    x: getXValue({point: d, xAxis, xScale}),
                    y: getYValue({point: d, yAxis: seriesYAxis, yScale: seriesYScale}),
                    opacity: get(d, 'opacity', null),
                },
                hovered: false,
                active: true,
                htmlElements: [],
            });
        });

        return acc;
    }, []);
};
