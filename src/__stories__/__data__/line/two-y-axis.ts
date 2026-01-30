import {dateTimeUtc} from '@gravity-ui/date-utils';

import type {ChartData} from '../../../types';
import marsWeatherData from '../mars-weather';

function prepareData(): ChartData {
    const data = marsWeatherData;
    const minTempData = data.map((d) => ({
        x: dateTimeUtc({input: d.terrestrial_date, format: 'YYYY-MM-DD'}).valueOf(),
        y: d.min_temp,
    }));
    const maxTempData = data.map((d) => ({
        x: dateTimeUtc({input: d.terrestrial_date, format: 'YYYY-MM-DD'}).valueOf(),
        y: d.max_temp,
    }));

    return {
        series: {
            data: [
                {
                    type: 'line',
                    data: minTempData,
                    name: 'Min Temperature',
                    yAxis: 0,
                },
                {
                    type: 'line',
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
        },
        title: {
            text: 'Mars weather',
        },
    };
}

export const lineTwoYAxisData = prepareData();
