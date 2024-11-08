import {dateTime} from '@gravity-ui/date-utils';

import type {ChartData} from '../../../types';
import marsWeatherData from '../mars-weather';

function prepareData(): ChartData {
    const minTempData = marsWeatherData.map((d) => ({
        x: dateTime({input: d.terrestrial_date, format: 'YYYY-MM-DD'}).valueOf(),
        y: d.min_temp,
    }));
    const maxTempData = marsWeatherData.map((d) => ({
        x: dateTime({input: d.terrestrial_date, format: 'YYYY-MM-DD'}).valueOf(),
        y: d.max_temp,
    }));

    return {
        series: {
            data: [
                {
                    type: 'scatter',
                    data: minTempData,
                    name: 'Min Temperature',
                    yAxis: 0,
                },
                {
                    type: 'scatter',
                    data: maxTempData,
                    name: 'Max Temperature',
                    yAxis: 1,
                },
            ],
        },
        yAxis: [
            {
                title: {
                    text: 'Min',
                },
            },
            {
                title: {
                    text: 'Max',
                },
            },
        ],
        xAxis: {
            type: 'datetime',
            title: {
                text: 'Terrestrial date',
            },
            ticks: {pixelInterval: 200},
        },
        title: {
            text: 'Mars weather',
        },
    };
}

export const scatterTwoYAxisData = prepareData();
