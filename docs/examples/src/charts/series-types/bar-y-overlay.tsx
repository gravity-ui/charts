import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

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

export default function BarYOverlayExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Bar-Y',
    title: 'Overlapping bars',
    description: 'Compare horizontal bars with grouping disabled and partial opacity.',
    docsUrl: 'pages/guides/series-types/bar-y.html#grouping-and-stacking',
} satisfies ExampleMeta;
