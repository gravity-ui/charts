import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = {
    series: {
        options: {'bar-y': {barMaxWidth: 1000}},
        data: [
            {
                type: 'bar-y',
                name: 'Plan',
                barPadding: 0.2,
                grouping: false,
                opacity: 0.6,
                data: [
                    {y: 'Q1', x: 100},
                    {y: 'Q2', x: 80},
                ],
            },
            {
                type: 'bar-y',
                name: 'Actual',
                barPadding: 0.6,
                grouping: false,
                dataLabels: {enabled: true, inside: true},
                data: [
                    {y: 'Q1', x: 75},
                    {y: 'Q2', x: 50},
                ],
            },
        ],
    },
    yAxis: [{type: 'category', categories: ['Q1', 'Q2']}],
};

export function BarYOverlayExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}
