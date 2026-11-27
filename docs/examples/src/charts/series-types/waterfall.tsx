import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData, WaterfallSeriesData} from '@gravity-ui/charts';

import type {ExampleMeta} from '../gallery';

const points: WaterfallSeriesData[] = [
    {x: 'Sales', y: 100},
    {x: 'March', role: 'subtotal'},
    {x: 'Purchases', y: -130},
    {x: 'June', role: 'subtotal'},
    {x: 'Refund', y: 10},
    {x: 'Closing', role: 'total'},
];

const data: ChartData = {
    xAxis: {type: 'category', categories: points.map((point) => String(point.x))},
    yAxis: [{padding: {min: '18px', max: '18px'}}],
    legend: {enabled: true},
    series: {
        data: [
            {
                type: 'waterfall',
                name: 'Cash balance',
                data: points,
                subtotal: {name: 'Quarter end', color: '#6086c7'},
                legend: {
                    itemText: {positive: 'Inflow', negative: 'Outflow', totals: 'Closing balance'},
                },
            },
        ],
    },
};

export default function WaterfallExample() {
    return (
        <div style={{height: '100%'}}>
            <Chart data={data} />
        </div>
    );
}

export const meta = {
    seriesType: 'Waterfall',
    title: 'Cash flow with quarter-end balances',
    description: 'Track changes in cash and read the balance at each quarter end.',
    docsUrl: 'pages/guides/series-types/waterfall.html#example',
    gallery: {order: 0},
} satisfies ExampleMeta;
