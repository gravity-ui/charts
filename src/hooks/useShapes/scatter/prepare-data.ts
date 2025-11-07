import get from 'lodash/get';

import type {ScatterSeriesData} from '../../../types';
import {getDataCategoryValue} from '../../../utils';
import type {ChartScale} from '../../useAxisScales';
import type {PreparedAxis} from '../../useChartOptions/types';
import type {PreparedScatterSeries} from '../../useSeries/types';
import {getXValue, getYValue} from '../utils';

import type {PreparedScatterData} from './types';

function getFilteredLinearScatterData(data: ScatterSeriesData[]) {
    return data.filter((d) => typeof d.x === 'number' && typeof d.y === 'number');
}

function getFilteredCategoryScatterData(args: {
    data: ScatterSeriesData[];
    xAxis: PreparedAxis;
    xScale: ChartScale;
    yAxis: PreparedAxis;
    yScale: ChartScale;
}) {
    const {data, xAxis, xScale, yAxis, yScale} = args;
    const xDomain = xScale.domain();
    const xCategories = get(xAxis, 'categories', [] as string[]);
    const yDomain = yScale.domain();
    const yCategories = get(yAxis, 'categories', [] as string[]);

    return data.filter((d) => {
        let xInRange = true;
        let yInRange = true;

        if (xAxis.type === 'category') {
            const dataCategory = getDataCategoryValue({
                axisDirection: 'x',
                categories: xCategories,
                data: d,
            });
            xInRange = (xDomain as string[]).indexOf(dataCategory) !== -1;
        }

        if (yAxis.type === 'category') {
            const dataCategory = getDataCategoryValue({
                axisDirection: 'y',
                categories: yCategories,
                data: d,
            });
            yInRange = (yDomain as string[]).indexOf(dataCategory) !== -1;
        }

        return xInRange && yInRange;
    });
}

export function prepareScatterData(args: {
    series: PreparedScatterSeries[];
    xAxis: PreparedAxis;
    xScale: ChartScale;
    yAxis: PreparedAxis[];
    yScale: (ChartScale | undefined)[];
    isOutsideBounds: (x: number, y: number) => boolean;
}): PreparedScatterData[] {
    const {series, xAxis, xScale, yAxis, yScale, isOutsideBounds} = args;

    return series.reduce<PreparedScatterData[]>((acc, s) => {
        const yAxisIndex = get(s, 'yAxis', 0);
        const seriesYAxis = yAxis[yAxisIndex];
        const seriesYScale = yScale[yAxisIndex];

        if (!seriesYScale) {
            return acc;
        }

        const filteredData =
            xAxis.type === 'category' || seriesYAxis.type === 'category'
                ? getFilteredCategoryScatterData({
                      data: s.data,
                      xAxis,
                      xScale,
                      yAxis: seriesYAxis,
                      yScale: seriesYScale,
                  })
                : getFilteredLinearScatterData(s.data);

        filteredData.forEach((d) => {
            const x = getXValue({point: d, xAxis, xScale});
            const y = getYValue({point: d, yAxis: seriesYAxis, yScale: seriesYScale});

            if (typeof x === 'undefined' || typeof y === 'undefined') {
                return;
            }

            acc.push({
                point: {
                    data: d,
                    series: s,
                    x,
                    y,
                    opacity: get(d, 'opacity', null),
                    color: d.color ?? s.color,
                },
                hovered: false,
                active: true,
                htmlElements: [],
                clipped: isOutsideBounds(x, y),
            });
        });

        return acc;
    }, []);
}
