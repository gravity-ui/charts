import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        options: {'bar-y': {borderWidth: 1, borderRadius: 4, opacity: 0.6}},
        data: [
            {
                type: 'bar-y',
                name: 'Plan',
                data: [
                    {x: 32, y: 'Jan'},
                    {x: 40, y: 'Feb'},
                    {x: 35, y: 'Mar'},
                ],
            },
            {
                type: 'bar-y',
                name: 'Actual',
                data: [
                    {x: 42, y: 'Jan'},
                    {x: 58, y: 'Feb'},
                    {x: 51, y: 'Mar'},
                ],
            },
        ],
    },
    yAxis: [{type: 'category', categories: ['Jan', 'Feb', 'Mar']}],
};

export default function BarYSeriesExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Bar-Y',
    title: 'Bar appearance',
    description: 'Style grouped horizontal bars with rounded borders and opacity.',
    docsUrl: 'pages/guides/series-types/bar-y.html#opacity',
} satisfies ExampleMeta;
