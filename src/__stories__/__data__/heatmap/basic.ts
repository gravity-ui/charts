import {dateTime} from '@gravity-ui/date-utils';
import {interpolateRgb} from 'd3';

import {DEFAULT_PALETTE} from '../../../constants';
import type {ChartData, HeatmapSeriesData, MeaningfulAny} from '../../../types';
import marsWeatherData from '../mars-weather';

function prepareData(): ChartData {
    const data = marsWeatherData as MeaningfulAny[];
    const months = Array.from(
        new Set(
            data.map((d) => {
                return dateTime({input: d.terrestrial_date, format: 'YYYY-MM-DD'}).format('MMMM');
            }),
        ),
    );

    const maxTemp = Math.max(...data.map((d) => Math.abs(d.max_temp)));
    const getColor = interpolateRgb(DEFAULT_PALETTE[1], DEFAULT_PALETTE[0]);

    const seriesData: HeatmapSeriesData[] = data.map((d) => {
        const date = dateTime({input: d.terrestrial_date, format: 'YYYY-MM-DD'});
        const colorValue = Math.abs(d.max_temp / maxTemp);
        return {
            x: date.date(),
            y: date.month(),
            value: d.max_temp,
            custom: {
                ...d,
                colorValue,
            },
            color: getColor(colorValue),
        };
    });

    return {
        title: {
            text: `Mars max temperature in ${dateTime({input: data[0].terrestrial_date, format: 'YYYY-MM-DD'}).format('YYYY')}`,
        },
        series: {
            data: [
                {
                    type: 'heatmap',
                    data: seriesData,
                    name: 'Mars weather',
                    dataLabels: {enabled: true},
                },
            ],
        },
        xAxis: {type: 'linear'},
        yAxis: [
            {
                type: 'category',
                categories: months,
            },
        ],
    };
}

export const heatmapBasicData = prepareData();
