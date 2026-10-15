import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'waterfall',
                name: 'Customers',
                dataLabels: {enabled: true},
                data: [
                    {x: 0, y: 120},
                    {x: 1, y: 45},
                    {x: 2, y: -20},
                    {x: 3, total: true},
                ],
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: ['Opening', 'New', 'Churned', 'Closing'],
    },
    yAxis: [
        {
            title: {text: 'Customers'},
        },
    ],
};

export default function WaterfallExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Waterfall',
    title: 'Basic waterfall chart',
    description: 'Positive and negative increments, a total column, and data labels.',
    docsUrl: 'pages/guides/series-types/waterfall.html#example',
    gallery: {
        order: 0,
    },
} satisfies ExampleMeta;
