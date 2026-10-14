import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    series: {
        options: {'bar-x': {borderWidth: 1, borderRadius: 4, opacity: 0.6}},
        data: [
            {
                type: 'bar-x',
                name: 'Plan',
                data: [
                    {x: 'Jan', y: 32},
                    {x: 'Feb', y: 40},
                    {x: 'Mar', y: 35},
                ],
            },
            {
                type: 'bar-x',
                name: 'Actual',
                data: [
                    {x: 'Jan', y: 42},
                    {x: 'Feb', y: 58},
                    {x: 'Mar', y: 51},
                ],
            },
        ],
    },
    xAxis: {type: 'category', categories: ['Jan', 'Feb', 'Mar']},
};

export default function BarXSeriesExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Bar-X',
    title: 'Column appearance',
    description: 'Style grouped columns with rounded borders and opacity.',
    docsUrl: 'pages/guides/series-types/bar-x.html#opacity',
} satisfies ExampleMeta;
