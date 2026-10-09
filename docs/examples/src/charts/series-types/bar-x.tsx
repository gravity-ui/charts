import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        options: {'bar-x': {borderWidth: 1, borderRadius: 4, opacity: 0.6}},
        data: [
            {
                type: 'bar-x',
                name: 'Plan',
                data: [
                    {x: 'Jan', y: 32},
                    {x: 'Feb', y: 40},
                    {x: 'Mar', y: 35},
                ],
            },
            {
                type: 'bar-x',
                name: 'Actual',
                data: [
                    {x: 'Jan', y: 42},
                    {x: 'Feb', y: 58},
                    {x: 'Mar', y: 51},
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
