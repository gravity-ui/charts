import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        options: {'bar-x': {borderWidth: 3, borderColor: '#283593', borderRadius: 6}},
        data: [
            {
                type: 'bar-x',
                name: 'Revenue',
                color: '#90caf9',
                data: [
                    {x: 'Jan', y: 42},
                    {x: 'Feb', y: 58},
                    {x: 'Mar', y: 51},
                ],
            },
            {
                type: 'bar-x',
                name: 'Expenses',
                color: '#a5d6a7',
                borderWidth: 2,
                borderColor: '#2e7d32',
                data: [
                    {x: 'Jan', y: 32},
                    {x: 'Feb', y: 40},
                    {x: 'Mar', y: 35},
                ],
            },
        ],
    },
    xAxis: {type: 'category', categories: ['Jan', 'Feb', 'Mar']},
};

export function BarXSeriesExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
