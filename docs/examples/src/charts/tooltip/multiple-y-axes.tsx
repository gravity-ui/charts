import React from 'react';

import {Chart, ChartTooltipContent} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    split: {enable: true, plots: [{}, {}]},
    xAxis: {type: 'category', categories: ['Jan', 'Feb', 'Mar']},
    yAxis: [
        {type: 'linear', title: {text: 'Requests'}},
        {type: 'category', categories: ['Low', 'High'], plotIndex: 1},
    ],
    series: {
        data: [
            {
                type: 'line',
                name: 'Requests',
                data: [
                    {x: 0, y: 10},
                    {x: 1, y: 20},
                    {x: 2, y: 15},
                ],
            },
            {
                type: 'line',
                name: 'Load',
                yAxis: 1,
                data: [
                    {x: 0, y: 1},
                    {x: 1, y: 0},
                    {x: 2, y: 1},
                ],
            },
        ],
    },
    tooltip: {
        renderer: (args) => (
            <ChartTooltipContent {...args} totals={{enabled: true, label: 'Total requests'}} />
        ),
    },
};

export default function MultipleYAxesTooltipExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Line',
    title: 'Tooltips across multiple axes',
    description: 'Customize tooltip content for numeric and categorical Y axes.',
    docsUrl: 'pages/guides/tooltip.html#multiple-y-axes-and-custom-content',
    gallery: {
        group: 'tooltip',
    },
} satisfies ExampleMeta;
