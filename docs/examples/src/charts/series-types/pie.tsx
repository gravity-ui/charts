import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    legend: {enabled: true},
    series: {
        data: [
            {
                type: 'pie',
                data: [
                    {name: 'Website', value: 60},
                    {name: 'App', value: 30},
                    {name: 'Store', value: 10},
                ],
            },
        ],
    },
};

export function PieExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
