import {dateTime} from '@gravity-ui/date-utils';

import type {ChartData} from '../../../../types';
import marsWeatherData from '../../mars-weather';

function prepareData(isSnap = true): ChartData {
    const data = marsWeatherData;
    const minTempData = data.map((d) => ({
        x: dateTime({input: d.terrestrial_date, format: 'YYYY-MM-DD'}).valueOf(),
        y: d.min_temp,
    }));
    const maxTempData = data.map((d) => ({
        x: dateTime({input: d.terrestrial_date, format: 'YYYY-MM-DD'}).valueOf(),
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
                crosshair: {enabled: true, color: 'red', snap: isSnap},
                title: {
                    text: 'Min',
                },
            },
            {
                crosshair: {enabled: true, color: 'blue', snap: isSnap},
                title: {
                    text: 'Max',
                },
            },
        ],
        xAxis: {
            crosshair: {enabled: true, color: 'green', snap: isSnap},
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

export const crosshairTwoYAxisData = prepareData();
export const crosshairTwoYAxisDataNotSnap = prepareData(false);
