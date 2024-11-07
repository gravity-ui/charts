import {dateTime} from '@gravity-ui/date-utils';

import type {ChartKitWidgetData} from '../../../types';
import marsWeatherData from '../mars-weather';

function prepareData(): ChartKitWidgetData {
    const data = marsWeatherData.map((d) => ({
        y: dateTime({input: d.terrestrial_date, format: 'YYYY-MM-DD'}).valueOf(),
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
