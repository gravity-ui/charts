import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'line',
                name: 'Revenue',
                data: [
                    {x: new Date('2022-01-01').getTime(), y: 120},
                    {x: new Date('2022-04-01').getTime(), y: 145},
                    {x: new Date('2022-07-01').getTime(), y: 162},
                    {x: new Date('2022-10-01').getTime(), y: 138},
                    {x: new Date('2023-01-01').getTime(), y: 155},
                    {x: new Date('2023-04-01').getTime(), y: 178},
                    {x: new Date('2023-07-01').getTime(), y: 195},
                    {x: new Date('2023-10-01').getTime(), y: 182},
                ],
            },
        ],
    },
    xAxis: {
        type: 'datetime',
        labels: {
            dateTimeLabelFormats: {
                quarter: '[Q]Q YYYY',
            },
        },
    },
    tooltip: {
        headerFormat: {type: 'date', format: '[Q]Q YYYY'},
    },
};

export function QuarterlyXAxisExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
