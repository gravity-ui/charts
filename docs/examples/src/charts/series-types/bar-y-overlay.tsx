import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'bar-y',
                name: 'Plan',
                grouping: false,
                opacity: 0.6,
                data: [
                    {y: 'A', x: 100},
                    {y: 'B', x: 80},
                ],
            },
            {
                type: 'bar-y',
                name: 'Actual',
                grouping: false,
                opacity: 0.6,
                dataLabels: {enabled: true, inside: true},
                data: [
                    {y: 'A', x: 75},
                    {y: 'B', x: 50},
                ],
            },
        ],
    },
    yAxis: [{type: 'category', categories: ['A', 'B']}],
};

export function BarYOverlayExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
