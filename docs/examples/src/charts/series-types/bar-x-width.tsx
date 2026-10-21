import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'bar-x',
                name: 'Plan',
                barMaxWidth: 80,
                data: [{x: 'Q1', y: 100}],
            },
            {
                type: 'bar-x',
                name: 'Actual',
                barMaxWidth: 24,
                data: [{x: 'Q1', y: 75}],
            },
        ],
    },
    xAxis: {type: 'category', categories: ['Q1']},
};

export default function BarXWidthExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Bar-X',
    title: 'Individual bar width limits',
    description: 'Set a different maximum thickness for each series.',
    docsUrl: 'pages/guides/series-types/bar-x.html#bar-thickness',
} satisfies ExampleMeta;
