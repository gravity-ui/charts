import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        options: {'bar-y': {borderWidth: 3, borderColor: '#283593', borderRadius: 6, opacity: 0.8}},
        data: [
            {
                type: 'bar-y',
                name: 'Actual',
                color: '#90caf9',
                data: [
                    {x: 42, y: 'Jan'},
                    {x: 58, y: 'Feb'},
                    {x: 51, y: 'Mar'},
                ],
            },
            {
                type: 'bar-y',
                name: 'Plan',
                color: '#a5d6a7',
                opacity: 0.3,
                borderWidth: 2,
                borderColor: '#2e7d32',
                data: [
                    {x: 32, y: 'Jan'},
                    {x: 40, y: 'Feb', opacity: 0.6},
                    {x: 35, y: 'Mar'},
                ],
            },
        ],
    },
    yAxis: [{type: 'category', categories: ['Jan', 'Feb', 'Mar']}],
};

export function BarYSeriesExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
