import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const data: ChartData = {
    xAxis: {type: 'category', categories: ['January', 'February', 'March']},
    series: {
        data: [
            {
                type: 'area',
                name: 'Desktop',
                stackLabels: {enabled: true},
                stacking: 'percent',
                data: [
                    {x: 0, y: 120},
                    {x: 1, y: 180},
                    {x: 2, y: 240},
                ],
            },
            {
                type: 'area',
                name: 'Mobile',
                stackLabels: {enabled: true},
                stacking: 'percent',
                data: [
                    {x: 0, y: 80},
                    {x: 1, y: 120},
                    {x: 2, y: 160},
                ],
            },
            {
                type: 'area',
                name: 'Forecast (excluded from total)',
                stacking: 'percent',
                stackLabels: {enabled: false},
                data: [
                    {x: 0, y: 30},
                    {x: 1, y: 40},
                    {x: 2, y: 50},
                ],
            },
        ],
        options: {
            area: {
                stackLabels: {
                    format: {type: 'number', precision: 0, postfix: ' visits'},
                },
            },
        },
    },
};

export default function StackLabelsExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Area',
    title: 'Stack total labels',
    description: 'Display formatted totals above stacked areas.',
    docsUrl: 'pages/guides/data-labels.html#stack-total-labels',
    gallery: {
        group: 'data-labels',
    },
} satisfies ExampleMeta;
