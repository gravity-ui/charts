import {dateTimeUtc} from '@gravity-ui/date-utils';

import type {ChartData} from '../../../types';
import marsWeatherData from '../mars-weather';

function prepareData(): ChartData {
    const data = marsWeatherData.map((d) => ({
        y: dateTimeUtc({input: d.terrestrial_date, format: 'YYYY-MM-DD'}).valueOf(),
        x: d.min_temp,
    }));

    return {
        series: {
            data: [
                {
                    type: 'bar-y',
                    data: data,
                    name: 'Min temperature',
                },
            ],
        },
        xAxis: {
            title: {
                text: 'Min temperature',
            },
        },
        yAxis: [
            {
                type: 'datetime',
                title: {
                    text: 'Terrestrial date',
                },
            },
        ],
        title: {
            text: 'Mars weather',
        },
    };
}

export const barYNegativeValuesData = prepareData();
