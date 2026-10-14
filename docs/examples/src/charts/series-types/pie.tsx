import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

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

export default function PieExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Pie',
    title: 'Basic pie chart',
    description: 'Basic pie configuration with named slices and a legend.',
    docsUrl: 'pages/guides/series-types/pie.html#example',
    gallery: {
        order: 0,
    },
} satisfies ExampleMeta;
