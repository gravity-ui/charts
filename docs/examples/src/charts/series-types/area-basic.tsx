import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'area',
                name: 'Active subscriptions',
                data: [
                    {x: 0, y: 120},
                    {x: 1, y: 150},
                    {x: 2, y: 145},
                    {x: 3, y: 180},
                    {x: 4, y: 210},
                    {x: 5, y: 240},
                ],
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    },
    yAxis: [
        {
            min: 0,
            title: {text: 'Subscriptions'},
        },
    ],
};

export default function AreaBasicExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Area',
    title: 'Basic area chart',
    description: 'Basic area configuration with a categorical X axis and a zero baseline.',
    docsUrl: 'pages/guides/series-types/area.html#example',
    gallery: {
        order: 0,
    },
} satisfies ExampleMeta;
