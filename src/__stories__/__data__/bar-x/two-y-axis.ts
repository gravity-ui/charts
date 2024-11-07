import {dateTime} from '@gravity-ui/date-utils';

import type {ChartKitWidgetData, MeaningfulAny} from '../../../types';
import marsWeatherData from '../mars-weather';

function prepareData(): ChartKitWidgetData {
    const data = marsWeatherData as MeaningfulAny[];
    const pressureData = data.map((d) => ({
        x: dateTime({input: d.terrestrial_date, format: 'YYYY-MM-DD'}).valueOf(),
        y: d.pressure,
    }));
    const tempData = data.map((d) => ({
        x: dateTime({input: d.terrestrial_date, format: 'YYYY-MM-DD'}).valueOf(),
        y: d.max_temp - d.min_temp,
    }));

    return {
        series: {
            data: [
                {
                    type: 'bar-x',
                    data: pressureData,
                    name: 'Pressure',
                    yAxis: 0,
                },
                {
                    type: 'bar-x',
                    data: tempData,
                    name: 'Temperature range',
                    yAxis: 1,
                },
            ],
        },
        yAxis: [
            {
                title: {
                    text: 'Pressure',
                },
            },
            {
                title: {
                    text: 'Temperature range',
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

export const barXTwoYAxisData = prepareData();
