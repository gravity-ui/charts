import {dateTime} from '@gravity-ui/date-utils';

import type {ChartData} from '../../../types';
import marsWeatherData from '../mars-weather';

function prepareData(): ChartData {
    const data = marsWeatherData.map((d) => ({
        x: dateTime({input: d.terrestrial_date, format: 'YYYY-MM-DD'}).valueOf(),
        y: d.min_temp,
    }));

    return {
        series: {
            data: [
                {
                    type: 'bar-x',
                    data: data,
                    name: 'Min temperature',
                },
            ],
        },
        yAxis: [
            {
                title: {
                    text: 'Min temperature',
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

export const barXNegativeValuesData = prepareData();
