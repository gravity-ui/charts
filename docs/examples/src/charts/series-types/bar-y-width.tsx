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
                barMaxWidth: 80,
                data: [{y: 'Q1', x: 100}],
            },
            {
                type: 'bar-y',
                name: 'Actual',
                barMaxWidth: 24,
                data: [{y: 'Q1', x: 75}],
            },
        ],
    },
    yAxis: [{type: 'category', categories: ['Q1']}],
};

export default function BarYWidthExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Bar-Y',
    title: 'Individual bar width limits',
    description: 'Set a different maximum thickness for each series.',
    docsUrl: 'pages/guides/series-types/bar-y.html#bar-thickness',
} satisfies ExampleMeta;
