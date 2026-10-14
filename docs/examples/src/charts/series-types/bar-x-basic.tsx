import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'bar-x',
                name: 'Orders',
                data: [
                    {x: 0, y: 42},
                    {x: 1, y: 58},
                    {x: 2, y: 51},
                    {x: 3, y: 73},
                ],
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: ['Q1', 'Q2', 'Q3', 'Q4'],
    },
    yAxis: [
        {
            min: 0,
            title: {text: 'Orders'},
        },
    ],
};

export default function BarXBasicExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Bar-X',
    title: 'Basic column chart',
    description: 'Basic vertical bar configuration with categories on the X axis.',
    docsUrl: 'pages/guides/series-types/bar-x.html#example',
    gallery: {
        order: 0,
    },
} satisfies ExampleMeta;
