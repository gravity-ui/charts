import {interpolateRgb} from 'd3';

import {DEFAULT_PALETTE} from '../../../constants';
import type {ChartData, HeatmapSeriesData} from '../../../types';

function prepareData(): ChartData {
    const data = new Array(99).fill(null).map((_, index) => index);
    const getColor = interpolateRgb(DEFAULT_PALETTE[0], DEFAULT_PALETTE[1]);

    const seriesData: HeatmapSeriesData[] = data.map((d) => {
        const colorValue = Math.abs(d / 100);
        return {
            x: Math.ceil((d + 1) / 3),
            y: d % 3,
            value: d,
            color: getColor(colorValue),
        };
    });

    return {
        yAxis: [{type: 'category', categories: ['1', '2', '3']}],
        series: {
            data: [
                {
                    type: 'heatmap',
                    data: seriesData,
                    name: 'Series 1',
                    dataLabels: {enabled: true},
                },
            ],
        },
    };
}

export const heatmapBasicData = prepareData();
