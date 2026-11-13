import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    legend: {enabled: false},
    xAxis: {
        grid: {dashStyle: 'Dot'},
        title: {text: 'Quarter'},
    },
    yAxis: [
        {
            grid: {dashStyle: 'ShortDash'},
            title: {text: 'Revenue'},
        },
    ],
    series: {
        data: [
            {
                type: 'line',
                name: 'Revenue',
                data: [
                    {x: 1, y: 20},
                    {x: 2, y: 40},
                    {x: 3, y: 30},
                    {x: 4, y: 60},
                ],
            },
        ],
    },
};

export default function GridDashStyleExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Line',
    title: 'Grid dash styles',
    description: 'Style vertical and horizontal grid lines independently.',
    docsUrl: 'pages/guides/axes/index.html#grid-lines',
    gallery: {group: 'axes'},
} satisfies ExampleMeta;
